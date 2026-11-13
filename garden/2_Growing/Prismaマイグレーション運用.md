---
dg-publish: true
title: Prismaマイグレーション運用
tags: [dev, prisma, database, workflow]
---

# Prismaマイグレーション運用

## ルール
スキーマを変えたら **必ず `migrate dev` で生成させる**。

```bash
cd apps/web
npx prisma migrate dev --name <migration_name>
```

- `migrate dev` が**マイグレーション履歴**（`prisma/migrations/` と `_prisma_migrations`）を作り、Prisma Client も再生成する。
- **手書きSQL**や `migrate deploy` だけで済ませると**履歴が残らず**、後からの差分追跡・チーム同期ができなくなる。
- `migrate deploy` は「既存マイグレーションを本番へ適用する」ときだけ。
- **一度適用したマイグレーションファイルは削除・改変しない**（DBのチェックサムと不整合になる）。

## 失敗談
手書きマイグレーションを足して、後から削除したら、適用済みDBと不整合に。→ 元の内容のまま**復元**して解消。`prisma migrate status` が「in sync」なら整合している。

## 設計のコツ：そもそも migrate を減らす
保存が要るものを**署名トークン等でステートレス化**できると、テーブル追加＝マイグレーション自体が不要になる。
→ [[MCPのOAuthをステートレスJWTで実装する]]（クライアント登録・認可コード・アクセストークンを全部JWTに）

## 教訓
- **自動化ツールに生成させる**。手作業は履歴を壊す。
- 繰り返す運用ルールは、セッションをまたいでも効くよう**リポジトリ直下の `CLAUDE.md`**（自動読込される場所）に書く。

関連: [[ユーザー横断を防ぐ設計]]
