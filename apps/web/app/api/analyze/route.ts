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

// POST /api/analyze - Analyze a dream
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dreamId, provider: userProvider, model: userModel } = await request.json();

    if (!dreamId) {
      return NextResponse.json(
        { error: 'Dream ID is required' },
        { status: 400 }
      );
    }

    // Get the dream (ensure it belongs to user)
    const dream = await prisma.dream.findFirst({
      where: { id: dreamId, userId: session.user.id },
    });

    if (!dream) {
      return NextResponse.json(
        { error: 'Dream not found' },
        { status: 404 }
      );
    }

    // Get AI provider configuration (user > env > default)
    const { provider, apiKey, model } = resolveProviderConfig(userProvider, userModel);
    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENROUTER_API_KEY'} is not configured` },
        { status: 500 }
      );
    }

    // Build analysis context from past dreams (userId-scoped)
    const userContext = await buildPastDreamContext(dream, session.user.id);

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

    let run;
    try {
      run = await analyzer.run(analysisRequest);
    } catch (aiError) {
      const detail = aiError instanceof Error ? aiError.message : String(aiError);
      await recordAiLog({
        userId: session.user.id,
        operation: 'ANALYZE',
        provider,
        model: analyzer['model'],
        prompt: analyzer['buildPrompt'](analysisRequest),
        status: 'ERROR',
        errorMessage: detail,
        dreamId: dream.id,
      });
      return NextResponse.json(
        {
          error: friendlyAiError(detail, provider, analyzer['model']),
          detail,
          provider,
          model: analyzer['model'],
        },
        { status: 502 }
      );
    }

    // 送信プロンプトと生レスポンスを動作ログに記録
    await recordAiLog({
      userId: session.user.id,
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
      model: analyzer['model'],
      result: run.result,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing dream:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: '夢の分析中に予期しないエラーが発生しました。', detail },
      { status: 500 }
    );
  }
}
