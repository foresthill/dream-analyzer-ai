# AI統合ガイド

## 概要

Dream AnalyzerはClaude API (Anthropic)を使用して夢の心理学的分析を行います。

## セットアップ

1. [Anthropic Console](https://console.anthropic.com/)でAPIキーを取得
2. `.env.local`にAPIキーを設定:
   ```
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

## DreamAnalyzerクラス

`packages/dream-core/src/analyzer/dream-analyzer.ts`

```typescript
import { DreamAnalyzer } from '@dream-analyzer/dream-core';

const analyzer = new DreamAnalyzer(apiKey);
const result = await analyzer.analyze({
  dream: {
    title: '空を飛ぶ夢',
    content: '...',
    mood: 'peaceful',
  },
});
```

## 分析レスポンス

```typescript
interface AnalysisResponse {
  psychologicalInterpretation: string;  // 心理学的解釈
  symbols: Array<{                       // シンボル分析
    symbol: string;
    category: string;
    interpretation: string;
  }>;
  themes: string[];                      // テーマ
  emotionalAnalysis: {                   // 感情分析
    primary: string;
    secondary: string[];
    intensity: number;
  };
  underlyingMeanings: string[];          // 潜在的意味
  insights: string[];                    // 洞察・アドバイス
}
```

## プロンプトカスタマイズ

`packages/dream-core/src/ai/prompt-builder.ts`でプロンプトをカスタマイズできます。

## エラーハンドリング

- APIキーが未設定の場合: 500エラー
- JSONパース失敗: 再試行またはフォールバック
- レート制限: 指数バックオフで再試行
