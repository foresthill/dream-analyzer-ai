import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ModelOption {
  value: string;
  label: string;
}

// Anthropic は現行の少数モデルを固定で提供。
// 速い/バランス型を先頭に（＝既定に選ばれる）。重いモデルは分析が60秒に収まらず
// 途中で切れることがあるため、末尾＋ラベルで注意を促す。
const ANTHROPIC_MODELS: ModelOption[] = [
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5（推奨・速い）' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5（最速・低コスト）' },
  { value: 'claude-opus-5', label: 'Claude Opus 5（高品質・遅め／途中で切れることあり）' },
];

// OpenRouter の候補スラッグ。実在するものだけ（ライブ一覧に存在するものだけ）を返すので、
// ここに古い/未提供のものが混ざっていても壊れたモデルは出ない。
// 速い/バランス型を上に、重い・推論系を下に並べる（上にあるほど既定に選ばれやすい）。
const OPENROUTER_PREFERRED = [
  // 速い/バランス型（分析が時間内に完走しやすい）
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-haiku',
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-001',
  'openai/gpt-5-mini',
  'openai/gpt-4o',
  'openai/gpt-4.1',
  'deepseek/deepseek-chat-v3.1',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-small-3.2-24b-instruct',
  'mistralai/mistral-large-2411',
  'mistralai/mistral-large',
  'google/gemini-2.5-pro',
  // 重め・推論系（時間がかかり、分析が途中で切れやすい）
  'anthropic/claude-opus-4.1',
  'anthropic/claude-3.7-sonnet',
  'openai/gpt-5',
  'openai/o3',
  'openai/o4-mini',
  'x-ai/grok-4',
  'x-ai/grok-3',
  'deepseek/deepseek-r1',
];

// ライブ取得に失敗したときの控えめなフォールバック
const OPENROUTER_FALLBACK: ModelOption[] = [
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'mistralai/mistral-large', label: 'Mistral Large' },
];

// GET /api/models - プロバイダー別の選択可能なモデル一覧
export async function GET() {
  let openrouter = OPENROUTER_FALLBACK;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      // 1時間キャッシュ（毎回叩かない）
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Array<{ id?: string; name?: string }> };
      const live = new Map<string, string>();
      for (const m of json.data ?? []) {
        if (m.id) live.set(m.id, m.name || m.id);
      }
      const filtered = OPENROUTER_PREFERRED
        .filter((id) => live.has(id))
        .map((id) => ({ value: id, label: live.get(id) as string }));
      if (filtered.length > 0) openrouter = filtered;
    }
  } catch {
    // フォールバックのまま
  }

  return NextResponse.json({ anthropic: ANTHROPIC_MODELS, openrouter });
}
