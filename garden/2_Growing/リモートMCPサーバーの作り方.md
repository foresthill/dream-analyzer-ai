---
dg-publish: true
title: リモートMCPサーバーの作り方
tags: [dev, mcp, ai, integration]
---

# リモートMCPサーバーの作り方

## 狙い
スマホ/PCの Claude から、自分の夢データを**直接読んで分析・対話**できるようにする。アプリの固定分析より、賢いモデルで対話的に深掘りできる。

## 構成
```
スマホ/PCのClaude ──(リモートMCP / HTTP)──> アプリの /api/mcp ──> 自分の夢DB
```
- 既存のNext.jsアプリに **`/api/mcp`** を1本追加（同じDBを再利用）。
- **JSON-RPC 2.0** を JSON で応答するステートレス実装（`initialize` / `tools/list` / `tools/call` / `ping`）。
- 公開ツール（すべて読み取り・[[ユーザー横断を防ぐ設計|userId厳守]]）:
  - `list_dreamers` / `list_dreams` / `get_dream` / `search_dreams` / `get_analysis`

## 認証
- 静的トークン（`Authorization: Bearer`）と、[[MCPのOAuthをステートレスJWTで実装する|OAuth]]の両対応。
- 未認証時は `401` に `WWW-Authenticate: Bearer resource_metadata=...` を付け、**OAuthを自動開始**させる。
- CORS と `OPTIONS` も用意（claude.ai のブラウザクライアント向け）。

## クライアント別の繋ぎ方
- **Claude Code (CLI)**: `claude mcp add --transport http <url> --header "Authorization: Bearer <token>"`（最も確実な動作確認）。
- **claude.ai / スマホ**: カスタムコネクターにURL登録 → OAuthで接続（トークン貼り付け不要）。
- **Claude Desktop**: カスタムコネクター（URL/OAuth）、または `claude_desktop_config.json` に `mcp-remote` でトークン接続。

## メモ：.mcpb（旧.dxt）との違い
`.mcpb` は **ローカルMCPサーバーを同梱配布**する形式。クラウド常駐のリモートMCPには不要で、URL登録 or `mcp-remote` が適切。

関連: [[AI動作ログで観測可能にする]]
