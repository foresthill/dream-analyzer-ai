# CLAUDE.md

> このファイルはリポジトリ直下にあり、Claude Code が**毎セッション自動で読み込みます**。
> セッションをまたいで記憶はリセットされるため、繰り返し守るべきルールは必ずここに書くこと。

## 🚨 絶対に守る運用ルール

### 1. Prisma マイグレーションは `migrate dev` で（履歴を必ず残す）
スキーマ（`apps/web/prisma/schema.prisma`）を変更したら、**必ず** Prisma に生成させる:

```bash
cd apps/web
npx prisma migrate dev --name <migration_name>
```

- ✅ `migrate dev` がマイグレーションファイルと `_prisma_migrations` 履歴を作り、Prisma Client も再生成する。
- ❌ **マイグレーションSQLを手書きしない**。`db push` だけで済ませない。`migrate deploy` で新規履歴を作らない。
- ❌ **一度適用したマイグレーションファイルを後から削除・改変しない**（DBのチェックサムと不整合になる）。
- `migrate deploy` は「既存マイグレーションを本番DBへ適用する」ときだけ使う。
- 環境の都合で `migrate dev` を実行できない場合は、**勝手に手書きで代替せず、ユーザーに実行を依頼する**こと。

### 2. プライバシー: ユーザー横断のデータ参照をしない
- 夢・分析・ログなどユーザーデータを取得するクエリは、原則 `userId`（必要に応じて `dreamerId`）で必ず絞る。
- RAG/過去参照のクエリも `userId` を含めること（dreamerId だけに頼らない）。

## プロジェクト構成（モノレポ / npm workspaces + Turbo）
- `apps/web` — Next.js 16 (App Router) + Prisma(PostgreSQL) + NextAuth v5。本体。
- `apps/mobile` — Expo（未実装中心）。
- `packages/dream-core` — 夢分析ロジック・AI呼び出し（`DreamAnalyzer`）。
- `packages/shared-types` — 共有型。
- `packages/ui-components` — 共有UI。

## 開発メモ・TODO の詳細
技術的決定事項や TODO は `docs/CLAUDE.md` に記録している。あわせて参照すること。

@docs/CLAUDE.md
