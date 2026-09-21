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
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      try {
        const run = await analyzer.streamRun(analysisRequest, (delta) => {
          send({ type: 'delta', text: delta });
        });

        // 動作ログ（成功）
        await recordAiLog({
          userId,
          operation: 'ANALYZE',
          provider: run.provider,
          model: run.model,
          prompt: run.prompt,
          response: run.rawResponse,
          status: 'SUCCESS',
          promptTokens: run.usage.promptTokens,
          completionTokens: run.usage.completionTokens,
          latencyMs: run.latencyMs,
          dreamId: dream.id,
        });

        const analysis = await persistAnalysis({
          dreamId: dream.id,
          provider,
          model: run.model,
          result: run.result,
        });

        send({ type: 'done', analysisId: analysis.id });
      } catch (aiError) {
        const detail = aiError instanceof Error ? aiError.message : String(aiError);
        // 動作ログ（エラー）
        await recordAiLog({
          userId,
          operation: 'ANALYZE',
          provider,
          model: analyzer['model'],
          prompt: analyzer['buildPrompt'](analysisRequest, { proseFirst: true }),
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
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
