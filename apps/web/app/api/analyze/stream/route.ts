import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DreamAnalyzer } from '@dream-analyzer/dream-core';
import { auth } from '@/auth';
import { recordAiLog } from '@/lib/ai-log';
import {
  friendlyAiError,
  resolveProviderConfig,
  buildPastDreamContext,
  persistAnalysis,
} from '@/lib/analyze-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/analyze/stream - 分析をストリーミングで返す（NDJSON: {type:'delta'|'done'|'error', ...}）
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { dreamId, provider: userProvider, model: userModel } = await request.json();
  if (!dreamId) {
    return NextResponse.json({ error: 'Dream ID is required' }, { status: 400 });
  }

  const dream = await prisma.dream.findFirst({
    where: { id: dreamId, userId },
  });
  if (!dream) {
    return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
  }

  const { provider, apiKey, model } = resolveProviderConfig(userProvider, userModel);
  if (!apiKey) {
    return NextResponse.json(
      { error: `${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENROUTER_API_KEY'} is not configured` },
      { status: 500 }
    );
  }

  const userContext = await buildPastDreamContext(dream, userId);
  const analyzer = new DreamAnalyzer({ provider, apiKey, model });
  const analysisRequest = {
    dream: {
      title: dream.title,
      content: dream.content,
      mood: dream.mood.toLowerCase(),
      emotions: dream.emotions,
      setting: dream.setting || undefined,
      characters: dream.characters,
    },
    userContext: userContext || undefined,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (obj: unknown) => {
        if (closed) return;
        // SSE 形式。iOS Safari 等が逐次受信できるよう text/event-stream で配信。
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      // バッファリング対策: 先頭で大きめのコメント行を送り、ストリームを即座に開かせる
      controller.enqueue(encoder.encode(`: ${' '.repeat(2048)}\n\n`));
      send({ type: 'start' });

      // サーバーレスの実行時間上限(60s)に対して余裕を持った時間予算。
      // 超えそうなら生成を中断し、その時点までの本文で“部分保存”して正常終了する
      // （流れた文章を取りこぼさない）。
      const TIME_BUDGET_MS = 50_000;
      let accumulated = '';
      const onText = (delta: string) => {
        accumulated += delta;
        send({ type: 'delta', text: delta });
      };
      const abortController = new AbortController();
      const budgetTimer = setTimeout(() => abortController.abort(), TIME_BUDGET_MS);
      const promptForLog = () => analyzer['buildPrompt'](analysisRequest, { proseFirst: true });

      try {
        let result: Awaited<ReturnType<typeof analyzer.streamRun>>['result'] | undefined;
        let usage: { promptTokens?: number; completionTokens?: number } = {};
        let rawResponse = '';
        let latencyMs: number | undefined;
        let partial = false;
        const startedAt = Date.now();

        try {
          const run = await analyzer.streamRun(analysisRequest, onText, abortController.signal);
          result = run.result;
          usage = run.usage;
          rawResponse = run.rawResponse;
          latencyMs = run.latencyMs;
        } catch (e) {
          // 時間切れ(abort)で、ある程度の本文が流れていれば“部分保存”する
          if (abortController.signal.aborted && accumulated.trim().length > 20) {
            result = analyzer.parseStreamResult(accumulated);
            rawResponse = accumulated;
            latencyMs = Date.now() - startedAt;
            partial = true;
          } else {
            throw e;
          }
        }

        if (!result) {
          throw new Error('分析結果を生成できませんでした');
        }

        // 動作ログ（成功／部分保存）
        await recordAiLog({
          userId,
          operation: 'ANALYZE',
          provider,
          model: analyzer['model'],
          prompt: promptForLog(),
          response: rawResponse,
          status: 'SUCCESS',
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          latencyMs,
          dreamId: dream.id,
        });

        const analysis = await persistAnalysis({
          dreamId: dream.id,
          provider,
          model: analyzer['model'],
          result,
        });

        send({ type: 'done', analysisId: analysis.id, partial });
      } catch (aiError) {
        const detail = aiError instanceof Error ? aiError.message : String(aiError);
        // 動作ログ（エラー）
        await recordAiLog({
          userId,
          operation: 'ANALYZE',
          provider,
          model: analyzer['model'],
          prompt: promptForLog(),
          status: 'ERROR',
          errorMessage: detail,
          dreamId: dream.id,
        });
        send({
          type: 'error',
          error: friendlyAiError(detail, provider, analyzer['model']),
          detail,
        });
      } finally {
        clearTimeout(budgetTimer);
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
