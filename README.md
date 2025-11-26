# Dream Analyzer - AI夢診断アプリ

夢の内容を記録・分析し、心理学的・象徴的な解釈を提供するアプリケーション。

## 技術スタック

### Web版
- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **TypeScript**: 5.7
- **Styling**: Tailwind CSS v3
- **AI**: Claude API (Anthropic) / OpenRouter (複数のLLM対応)
- **State**: Zustand
- **Database**: Vercel Postgres
- **ORM**: Prisma 6.0
- **Monorepo**: Turborepo

## 始め方

### 前提条件
- Node.js 20+
- npm 10+
- PostgreSQL

### インストール

```bash
# 依存関係のインストール
npm install

# Prismaクライアントの生成（postinstallで自動実行されます）
npm run db:generate --workspace=@dream-analyzer/web

# データベースマイグレーション（初回セットアップ）
npm run db:migrate --workspace=@dream-analyzer/web
```

### 環境変数

`apps/web/.env.local` を作成:

#### Option 1: Anthropic直接接続（デフォルト）
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dream_analyzer"
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
# AI_MODEL="claude-sonnet-4-20250514"  # オプション: モデル指定
```

#### Option 2: OpenRouter経由（複数LLM対応）
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dream_analyzer"
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-..."
AI_MODEL="anthropic/claude-3.5-sonnet"  # 使用するモデルを指定
```

**利用可能なモデル例（OpenRouter）:**
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `google/gemini-pro-1.5` - Gemini Pro 1.5
- `meta-llama/llama-3.1-70b-instruct` - Llama 3.1 70B

その他のモデルは [OpenRouter Models](https://openrouter.ai/models) を参照

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリが起動します。

## プロジェクト構造

```
dream-analyzer/
├── apps/
│   ├── web/            # Next.js Web アプリ
│   └── mobile/         # Expo モバイルアプリ（将来）
├── packages/
│   ├── dream-core/     # 共通ビジネスロジック・AI分析
│   ├── shared-types/   # 共有型定義
│   └── ui-components/  # 共有UIコンポーネント
└── docs/               # ドキュメント
```

## 主な機能

- 🌙 夢の記録（タイトル、内容、気分、明晰度など）
- 🔍 AI による心理学的・象徴的分析
- 🤖 **複数AIモデル対応** - Anthropic、OpenAI、Google、Meta、Mistralなど12種類のモデルから選択可能
- 📊 傾向分析とインサイト
- 📖 夢のシンボル辞典

## 実装済み機能

### Phase 1: AIモデル選択機能 ✅

ユーザーが異なるAIモデルを試して比較できる機能を実装しました。

#### 機能詳細:

1. **設定画面 (`/settings`)**
   - AIプロバイダーの選択（Anthropic / OpenRouter）
   - モデルのドロップダウン選択
   - 設定はブラウザに永続化（Zustand persist）

2. **対応モデル**
   - **Anthropic Direct**: Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3 Opus
   - **OpenRouter経由**:
     - Claude 3.5 Sonnet, Claude 3 Opus
     - GPT-4 Turbo, GPT-4o
     - Gemini Pro 1.5, Gemini Flash 1.5
     - Llama 3.1 70B, Llama 3.1 405B
     - Mistral Large

3. **分析結果の記録**
   - 各分析にどのプロバイダー・モデルを使用したか記録
   - 分析結果画面に使用モデルをバッジ表示
   - データベースにprovider/modelフィールド追加（インデックス付き）

4. **モデル選択の優先順位**
   ```
   ユーザー設定 > 環境変数 > デフォルト値
   ```

#### 実装ファイル:
- `apps/web/store/settings-store.ts` - Zustand設定ストア
- `apps/web/app/settings/page.tsx` - 設定画面UI
- `apps/web/prisma/schema.prisma` - provider/model フィールド追加
- `apps/web/components/analysis/analysis-result.tsx` - モデル情報表示

### Phase 2-3: 計画中の機能

詳細は [`docs/CLAUDE.md`](./docs/CLAUDE.md) を参照してください。

- モデルごとの分析結果フィルタリング
- ユーザー評価機能（1-5星）
- モデル統計・比較ダッシュボード
- 夢のカテゴリ別モデル精度分析
- モデル推奨機能

## データベースマイグレーション

新しいマイグレーションを作成・適用する場合（開発環境）：

```bash
npm run db:migrate --workspace=@dream-analyzer/web
```

マイグレーション名を指定する場合：

```bash
cd apps/web
npx prisma migrate dev --name your_migration_name
```

本番環境で既存のマイグレーションを適用する場合：

```bash
cd apps/web
npx prisma migrate deploy
```

**注意**: `prisma migrate dev` はマイグレーションファイル（`prisma/migrations/`）を作成・保存します。これにより、変更履歴が追跡され、チーム間でのデータベーススキーマの同期が容易になります。

## ライセンス

MIT
