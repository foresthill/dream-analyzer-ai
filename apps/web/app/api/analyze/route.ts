import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DreamAnalyzer } from '@dream-analyzer/dream-core';
import { auth } from '@/auth';
import { recordAiLog } from '@/lib/ai-log';

// AI呼び出しの生エラーメッセージを、原因別の分かりやすい日本語に変換する
function friendlyAiError(detail: string, provider: string, model: string): string {
  const m = detail.toLowerCase();
  if (/parse|json/.test(m)) {
    return `AIの応答を解析できませんでした（モデルが想定の形式で返しませんでした）。もう一度お試しください。モデル: ${model}`;
  }
  if (/401|403|invalid.*api.?key|authentication|x-api-key/.test(m)) {
    return `AIのAPIキーが無効か権限がありません（${provider}）。サーバーのAPIキー設定を確認してください。`;
  }
  if (/429|rate.?limit|quota|insufficient|credit|billing/.test(m)) {
    return `AIの利用制限に達しました（レート制限またはクレジット不足）。少し待つか、プランを確認してください。`;
  }
  if (/overloaded|529|503|502|timeout|timed out|econn|network|fetch failed/.test(m)) {
    return `AIサービスが一時的に混み合っている/応答しませんでした。少し待ってから再試行してください。`;
  }
  if (/not.?found|404|model|does not exist|unsupported/.test(m)) {
    return `指定したAIモデル「${model}」が利用できません。設定で別のモデルを選んでください。`;
  }
  return `AIの分析中にエラーが発生しました（${provider} / ${model}）。`;
}

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
      const detail = aiError instanceof Error ? aiError.message : String(aiError);
      // AI呼び出し／パース失敗も動作ログに残す
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
      // 何が起きたか分かるように、原因別のメッセージ＋技術詳細を返す
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
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: '夢の分析中に予期しないエラーが発生しました。', detail },
      { status: 500 }
    );
  }
}
