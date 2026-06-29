import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DreamAnalyzer } from '@dream-analyzer/dream-core';
import { auth } from '@/auth';
import { recordAiLog } from '@/lib/ai-log';

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

    // Get AI provider configuration
    // Priority: user selection > environment variable > default
    const provider = (userProvider || process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openrouter';
    const apiKey = provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENROUTER_API_KEY;
    const model = userModel || process.env.AI_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENROUTER_API_KEY'} is not configured` },
        { status: 500 }
      );
    }

    // Fetch past dreams for context (same dreamer, last 10, excluding current)
    const pastDreams = await prisma.dream.findMany({
      where: {
        userId: session.user.id, // 念のためユーザー横断を防ぐ
        dreamerId: dream.dreamerId,
        id: { not: dream.id },
        analyzed: true,
      },
      include: {
        analyses: {
          take: 1,
          orderBy: { analyzedAt: 'desc' },
          select: { themes: true, symbols: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const recentDreams = pastDreams.map(
      (d) => `[${d.date.toISOString().split('T')[0]}] ${d.title}: ${d.content.slice(0, 100)}`
    );

    const themeCounts = new Map<string, number>();
    const symbolCounts = new Map<string, number>();
    for (const d of pastDreams) {
      for (const a of d.analyses) {
        for (const t of a.themes) {
          themeCounts.set(t, (themeCounts.get(t) || 0) + 1);
        }
        for (const s of a.symbols as Array<{ symbol: string }>) {
          symbolCounts.set(s.symbol, (symbolCounts.get(s.symbol) || 0) + 1);
        }
      }
    }
    const recurringThemes = Array.from(themeCounts.entries())
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${t}(${c}回)`);
    const recurringSymbols = Array.from(symbolCounts.entries())
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s, c]) => `${s}(${c}回)`);

    // Analyze the dream
    const analyzer = new DreamAnalyzer({
      provider,
      apiKey,
      model,
    });

    const analysisRequest = {
      dream: {
        title: dream.title,
        content: dream.content,
        mood: dream.mood.toLowerCase(),
        emotions: dream.emotions,
        setting: dream.setting || undefined,
        characters: dream.characters,
      },
      userContext: recentDreams.length > 0 ? {
        recentDreams,
        recurringThemes,
        recurringSymbols,
      } : undefined,
    };

    let run;
    try {
      run = await analyzer.run(analysisRequest);
    } catch (aiError) {
      // AI呼び出し／パース失敗も動作ログに残す
      await recordAiLog({
        userId: session.user.id,
        operation: 'ANALYZE',
        provider,
        model: analyzer['model'],
        prompt: analyzer['buildPrompt'](analysisRequest),
        status: 'ERROR',
        errorMessage: aiError instanceof Error ? aiError.message : String(aiError),
        dreamId: dream.id,
      });
      throw aiError;
    }

    const result = run.result;

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

    // Check if analysis with this provider/model already exists
    const existingAnalysis = await prisma.dreamAnalysis.findFirst({
      where: {
        dreamId: dream.id,
        provider,
        model: analyzer['model'],
      },
    });

    // Delete existing analysis if it exists (re-analysis)
    if (existingAnalysis) {
      await prisma.dreamAnalysis.delete({
        where: { id: existingAnalysis.id },
      });
    }

    // Save the analysis
    const analysis = await prisma.dreamAnalysis.create({
      data: {
        dreamId: dream.id,
        psychologicalInterpretation: result.psychologicalInterpretation,
        symbols: result.symbols,
        themes: result.themes,
        emotionalAnalysis: result.emotionalAnalysis,
        underlyingMeanings: result.underlyingMeanings,
        insights: result.insights,
        relatedDreams: [],
        provider,
        model: analyzer['model'], // Get the actual model used from analyzer
      },
    });

    // Mark dream as analyzed
    await prisma.dream.update({
      where: { id: dreamId },
      data: { analyzed: true },
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing dream:', error);
    return NextResponse.json(
      { error: 'Failed to analyze dream' },
      { status: 500 }
    );
  }
}
