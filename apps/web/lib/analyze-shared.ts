import { prisma } from '@/lib/db';
import type { AnalysisResponse } from '@dream-analyzer/shared-types';

/**
 * AI呼び出しの生エラーメッセージを、原因別の分かりやすい日本語に変換する。
 * /api/analyze と /api/analyze/stream で共用。
 */
export function friendlyAiError(detail: string, provider: string, model: string): string {
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

export interface AiProviderConfig {
  provider: 'anthropic' | 'openrouter';
  apiKey?: string;
  model?: string;
}

/**
 * リクエスト/環境変数から使用するプロバイダー・APIキー・モデルを決定する。
 * 優先順位: ユーザー選択 > 環境変数 > 既定。
 */
export function resolveProviderConfig(userProvider?: string, userModel?: string): AiProviderConfig {
  const provider = (userProvider || process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openrouter';
  const apiKey = provider === 'anthropic'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENROUTER_API_KEY;
  const model = userModel || process.env.AI_MODEL;
  return { provider, apiKey, model };
}

export interface UserAnalysisContext {
  recentDreams: string[];
  recurringThemes: string[];
  recurringSymbols: string[];
}

/**
 * 同じ「夢を見た人」の過去の夢から、AI分析用の文脈（履歴・繰り返しテーマ/シンボル）を作る。
 * 必ず userId で絞り、ユーザー横断参照を防ぐ。履歴が無ければ null。
 */
export async function buildPastDreamContext(
  dream: { id: string; dreamerId: string },
  userId: string
): Promise<UserAnalysisContext | null> {
  const pastDreams = await prisma.dream.findMany({
    where: {
      userId, // 念のためユーザー横断を防ぐ
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

  if (pastDreams.length === 0) return null;

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

  return { recentDreams, recurringThemes, recurringSymbols };
}

/**
 * 分析結果をDBへ保存する（同一 provider/model の既存分析は置き換え）。
 */
export async function persistAnalysis(params: {
  dreamId: string;
  provider: string;
  model: string;
  result: AnalysisResponse;
}) {
  const { dreamId, provider, model, result } = params;

  const existing = await prisma.dreamAnalysis.findFirst({
    where: { dreamId, provider, model },
  });
  if (existing) {
    await prisma.dreamAnalysis.delete({ where: { id: existing.id } });
  }

  const analysis = await prisma.dreamAnalysis.create({
    data: {
      dreamId,
      psychologicalInterpretation: result.psychologicalInterpretation,
      symbols: result.symbols,
      themes: result.themes,
      emotionalAnalysis: result.emotionalAnalysis,
      underlyingMeanings: result.underlyingMeanings,
      insights: result.insights,
      relatedDreams: [],
      provider,
      model,
    },
  });

  await prisma.dream.update({
    where: { id: dreamId },
    data: { analyzed: true },
  });

  return analysis;
}
