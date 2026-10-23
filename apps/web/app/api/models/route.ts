import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ModelOption {
  value: string;
  label: string;
}

// Anthropic は現行の少数モデルを固定で提供
const ANTHROPIC_MODELS: ModelOption[] = [
  { value: 'claude-opus-5', label: 'Claude Opus 5（最高品質）' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5（バランス）' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5（高速・低コスト）' },
];

// OpenRouter の候補スラッグ。実在するものだけ（ライブ一覧に存在するものだけ）を返すので、
// ここに古い/未提供のものが混ざっていても壊れたモデルは出ない。
const OPENROUTER_PREFERRED = [
  // Anthropic
  'anthropic/claude-opus-4.1',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-3.5-haiku',
  // OpenAI
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-4.1',
  'openai/gpt-4o',
  'openai/o3',
  'openai/o4-mini',
  // Google
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-001',
  // DeepSeek
  'deepseek/deepseek-chat-v3.1',
  'deepseek/deepseek-r1',
  // xAI
  'x-ai/grok-4',
  'x-ai/grok-3',
  // Meta
  'meta-llama/llama-3.3-70b-instruct',
  // Mistral
  'mistralai/mistral-large-2411',
  'mistralai/mistral-large',
  'mistralai/mistral-small-3.2-24b-instruct',
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
