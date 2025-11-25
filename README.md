# Dream Analyzer - AI夢診断アプリ

夢の内容を記録・分析し、心理学的・象徴的な解釈を提供するアプリケーション。

## 技術スタック

### Web版
- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **TypeScript**: 5.7
- **Styling**: Tailwind CSS v3
- **AI**: Claude API (Anthropic)
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

# データベースのセットアップ
npm run db:push --workspace=@dream-analyzer/web
```

### 環境変数

`apps/web/.env.local` を作成:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dream_analyzer"
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
```

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
- 📊 傾向分析とインサイト
- 📖 夢のシンボル辞典

## ライセンス

MIT
