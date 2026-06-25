# apps/web — CLAUDE.md

> `apps/web` 配下で作業するとき、Claude Code がこのファイルを自動で読み込みます。

## 🚨 Prisma マイグレーションのルール（最重要）
スキーマ（`prisma/schema.prisma`）を変えたら **必ず** Prisma に生成させる:

```bash
cd apps/web
npx prisma migrate dev --name <migration_name>
```

- マイグレーションSQLを**手書きしない**。`migrate dev` の生成物を正とする。
- 一度適用したマイグレーションは**削除・改変しない**（チェックサム不整合になる）。
- 本番反映は `npx prisma migrate deploy`（新規履歴は作らない）。
- 環境で `migrate dev` を回せないときは、手書きで代替せず**ユーザーに実行を依頼する**。

詳細・他のルールはリポジトリ直下の `/CLAUDE.md` を参照。
