---
dg-publish: true
title: MCPのOAuthをステートレスJWTで実装する
tags: [dev, mcp, oauth, auth]
---

# MCPのOAuthをステートレスJWTで実装する

## 背景
claude.ai（スマホ）のカスタムコネクターは、静的トークンの貼り付けではなく **OAuth** を求める。[[リモートMCPサーバーの作り方|リモートMCP]]に、MCPの認可仕様（OAuth 2.1 + PKCE + 動的クライアント登録）を実装する必要があった。

## 方針：全部ステートレス（DB不要＝マイグレーション不要）
`AUTH_SECRET` で署名した **JWT(HS256)** で、以下を表現:
- **クライアント登録(DCR)**: `client_id` 自体に `redirect_uris` を内包した署名トークン。
- **認可コード**: userId / code_challenge / redirect_uri を内包、短命（10分）。
- **アクセストークン**: userId を内包（30日）。

→ 認可コードもクライアントも保存しないので、テーブル追加なしで成立。

## エンドポイント
- ディスカバリ: `/.well-known/oauth-protected-resource`（RFC 9728）、`/.well-known/oauth-authorization-server`（RFC 8414）。
  - Next.js の**ドット始まりフォルダのルーティング差異**を避けるため、実体は通常パスに置き **rewrites** で `/.well-known/*` にマップ。
- `/api/oauth/register`（DCR）/ `/authorize`（ログイン＋同意→コード）/ `/token`（PKCE検証→アクセストークン）。
- `/api/mcp` は静的トークンとアクセストークンの両方を受理。

## PKCE
`code_challenge` は `S256`。トークン発行時に `base64url(sha256(code_verifier)) == code_challenge` をタイミングセーフ比較で検証。

## 教訓
- **保存が要るものほど、署名トークンで“状態を持たせない”設計にできないか考える**。マイグレーションも運用も軽くなる。
- 仕様の細部（ディスカバリのパス、`WWW-Authenticate` の形式、CORS）はクライアントの実挙動に左右される。**実機で詰める前提**で作る。

関連: [[ユーザー横断を防ぐ設計]] / [[Prismaマイグレーション運用]]
