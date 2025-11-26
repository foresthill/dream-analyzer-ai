# AI統合ガイド

## 概要

Dream Analyzerは2つのAIプロバイダーオプションをサポートしています：
1. **Anthropic Direct** - Anthropic APIへの直接接続
2. **OpenRouter** - 統一されたAPIを通じて複数のLLMプロバイダーにアクセス

## 設定

### 環境変数

```env
# プロバイダー選択（デフォルト: anthropic）
AI_PROVIDER="anthropic"  # または "openrouter"

# Anthropic Direct
ANTHROPIC_API_KEY="sk-ant-..."
AI_MODEL="claude-sonnet-4-20250514"  # オプション

# OpenRouter
OPENROUTER_API_KEY="sk-or-..."
AI_MODEL="anthropic/claude-3.5-sonnet"  # OpenRouterでは必須
```

## プロバイダー比較

### Anthropic Direct

**メリット:**
- 公式SDK対応
- 最新モデルが即座に利用可能
- Anthropicから直接請求

**デメリット:**
- Claudeモデルのみ
- 個別のAPIキー管理

**推奨用途:** Claudeモデルを使った本番運用

### OpenRouter

**メリット:**
- 複数プロバイダーの100以上のモデルにアクセス
- 全モデルに対して単一のAPIキー
- モデル比較とテスト
- 従量課金制

**デメリット:**
- 追加の抽象化レイヤー
- わずかに高いレイテンシ

**推奨用途:** 開発、テスト、マルチモデルサポート

## サポートモデル

### Anthropic Direct経由
- `claude-sonnet-4-20250514` (デフォルト)
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`

### OpenRouter経由
- **Anthropic:** `anthropic/claude-3.5-sonnet`, `anthropic/claude-3-opus`
- **OpenAI:** `openai/gpt-4-turbo`, `openai/gpt-4o`
- **Google:** `google/gemini-pro-1.5`, `google/gemini-flash-1.5`
- **Meta:** `meta-llama/llama-3.1-70b-instruct`, `meta-llama/llama-3.1-405b-instruct`
- **Mistral:** `mistralai/mistral-large`
- **その他100以上...**

完全なリストは [OpenRouter Models](https://openrouter.ai/models) を参照

## 実装詳細

`DreamAnalyzer`クラスは自動的にプロバイダー切り替えを処理します：

```typescript
import { DreamAnalyzer } from '@dream-analyzer/dream-core';

// Anthropic Direct
const analyzer = new DreamAnalyzer({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});

// OpenRouter
const analyzer = new DreamAnalyzer({
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'anthropic/claude-3.5-sonnet',
});
```

## Vercelデプロイ

Vercel Dashboardで環境変数を設定：
- `AI_PROVIDER` - "anthropic" または "openrouter"
- `ANTHROPIC_API_KEY` または `OPENROUTER_API_KEY`
- `AI_MODEL` (Anthropicではオプション、OpenRouterでは必須)

## コスト考慮事項

- **Anthropic Direct:** 標準のAnthropicプライシング
- **OpenRouter:** モデル固有のプライシング + 小さなOpenRouter手数料

現在の価格を確認：
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [OpenRouter Pricing](https://openrouter.ai/models)
