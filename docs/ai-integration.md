# AI統合ガイド

## 概要

Dream Analyzerは2つのAIプロバイダーオプションをサポートしています：
1. **Anthropic Direct** - Anthropic APIへの直接接続
2. **OpenRouter** - 統一されたAPIを通じて複数のLLMプロバイダーにアクセス

## 過去の夢の文脈を活用した分析

### 仕組み

AI分析時に、単に今回の夢だけでなく**過去の夢の履歴やパターン**をLLMに渡すことで、より深い分析を実現しています。

```
┌─────────────────┐
│  新しい夢の記録   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  DBから過去の夢を取得               │
│  ・同じ「夢を見た人」の直近10件     │
│  ・分析済みの夢のテーマ・シンボル   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  パターン検出                       │
│  ・2回以上出現するテーマを集計      │
│  ・2回以上出現するシンボルを集計    │
│  （例: 「水(3回)」「追われる(2回)」）│
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  LLMに送信するプロンプト            │
│  ・今回の夢の内容                   │
│  ・最近の夢の履歴（日付+タイトル+概要）│
│  ・繰り返し出現するテーマ一覧       │
│  ・繰り返し出現するシンボル一覧     │
│  ・「過去の夢との関連性にも言及せよ」│
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  AI分析結果      │
│  （過去のパターン│
│    を踏まえた    │
│    深い解釈）    │
└─────────────────┘
```

### 対象となるデータ

| データ | 取得件数 | 用途 |
|--------|----------|------|
| 過去の夢の概要 | 直近10件 | LLMが時系列的な文脈を把握 |
| 繰り返しテーマ | 2回以上出現したもの全て | 「変化への不安」等の傾向を把握 |
| 繰り返しシンボル | 2回以上出現した上位10件 | 「水」「階段」等の象徴の傾向 |

### チャット（フォローアップ会話）での活用

分析後のチャット機能でも、同じ夢を見た人の直近5件の過去の夢をシステムプロンプトに含めています。これにより：

- 「前に似たような夢を見たけど、関連はある？」
- 「最近の夢に共通するテーマは何？」

といった質問に対しても、文脈を踏まえた回答が可能です。

### 技術的な詳細

**関連ファイル:**
- `apps/web/app/api/analyze/route.ts` - 初回分析時の過去夢取得・パターン検出
- `apps/web/app/api/analyze/[analysisId]/chat/route.ts` - チャット時の過去夢取得
- `packages/dream-core/src/analyzer/dream-analyzer.ts` - プロンプト構築
- `packages/shared-types/src/analysis.ts` - `AnalysisRequest`型定義（`userContext`）

**データの流れ:**
1. `route.ts` で Prisma を使い同じ dreamer の過去の夢を取得
2. テーマ・シンボルの出現回数を集計
3. `AnalysisRequest.userContext` にセットして `DreamAnalyzer.analyze()` に渡す
4. `buildPrompt()` でプロンプトの「履歴」セクションに組み込む

**初回の夢（履歴なし）の場合:**
`userContext` が `undefined` になり、履歴セクションは省略されます。従来通りの単発分析として動作します。

**「夢を見た人」ごとに分離:**
履歴は `dreamerId` で絞り込むため、家族で使い分けている場合でも、それぞれの人の夢の文脈が混ざることはありません。

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
