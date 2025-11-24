# アーキテクチャ

## モノレポ構成

このプロジェクトはTurborepoを使用したモノレポ構成を採用しています。

### パッケージ

#### apps/web
Next.js 15を使用したWebアプリケーション。

主要なディレクトリ:
- `app/` - App Routerのページとルート
- `components/` - Reactコンポーネント
- `lib/` - ユーティリティ関数
- `hooks/` - カスタムフック
- `store/` - Zustand状態管理
- `prisma/` - データベーススキーマ

#### packages/dream-core
夢分析のコアロジック。

- `analyzer/` - 分析エンジン
- `symbols/` - シンボルデータベース
- `ai/` - AIプロンプト構築

#### packages/shared-types
共有TypeScript型定義。

- `dream.ts` - 夢関連の型
- `analysis.ts` - 分析関連の型
- `symbol.ts` - シンボル関連の型

## データフロー

1. ユーザーが夢を記録
2. API経由でデータベースに保存
3. AI分析APIを呼び出し
4. Claude APIで分析を実行
5. 結果をデータベースに保存
6. UIに分析結果を表示

## 拡張性

### モバイル対応
`apps/mobile`にExpoプロジェクトを追加することで、
共有パッケージを再利用してモバイルアプリを構築できます。
