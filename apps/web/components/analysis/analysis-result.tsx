'use client';

import { SymbolTag } from './symbol-tag';
import { TextToSpeechButton } from '@/components/voice/text-to-speech-button';

interface AnalysisResultProps {
  analysis: {
    psychologicalInterpretation: string;
    symbols: unknown;
    themes: string[];
    emotionalAnalysis: unknown;
    underlyingMeanings: string[];
    insights: string[];
    analyzedAt: Date;
    provider?: string;
    model?: string;
  };
}

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  const symbols = analysis.symbols as Array<{
    symbol: string;
    category: string;
    interpretation: string;
  }>;

  const emotionalAnalysis = analysis.emotionalAnalysis as {
    primary: string;
    secondary: string[];
    intensity: number;
  };

  // 全体を読み上げ用のテキストを生成
  const fullText = `
    心理学的解釈。${analysis.psychologicalInterpretation}。
    シンボル分析。${symbols.map(s => `${s.symbol}は${s.interpretation}`).join('。')}。
    テーマ。${analysis.themes.join('、')}。
    感情分析。主要な感情は${emotionalAnalysis.primary}です。${emotionalAnalysis.secondary.length > 0 ? `副次的な感情は${emotionalAnalysis.secondary.join('、')}です。` : ''}
    潜在的な意味。${analysis.underlyingMeanings.join('。')}。
    洞察とアドバイス。${analysis.insights.join('。')}。
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="space-y-6">
      {/* Model information */}
      {(analysis.provider || analysis.model) && (
        <div className="rounded-lg border border-border bg-secondary p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">使用モデル:</span>
            <span className="font-mono text-muted-foreground">
              {analysis.provider === 'openrouter' ? 'OpenRouter / ' : ''}
              {analysis.model || 'Unknown'}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(analysis.analyzedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
            </span>
          </div>
        </div>
      )}

      {/* 全体読み上げボタン */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-primary/5 p-4">
        <span className="text-sm font-medium">解析結果を音声で聴く</span>
        <TextToSpeechButton text={fullText} size="md" showLabel={true} />
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">心理学的解釈</h2>
          <TextToSpeechButton
            text={analysis.psychologicalInterpretation}
            size="sm"
            showLabel={false}
          />
        </div>
        <p className="text-muted-foreground">{analysis.psychologicalInterpretation}</p>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 text-xl font-semibold">シンボル分析</h2>
        <div className="space-y-3">
          {symbols.map((symbol, index) => (
            <div key={index} className="rounded-lg bg-secondary p-3">
              <div className="mb-1 flex items-center gap-2">
                <SymbolTag symbol={symbol.symbol} category={symbol.category} />
              </div>
              <p className="text-sm text-muted-foreground">{symbol.interpretation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 text-xl font-semibold">テーマ</h2>
        <div className="flex flex-wrap gap-2">
          {analysis.themes.map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 text-xl font-semibold">感情分析</h2>
        <div className="space-y-2">
          <p>
            <span className="text-muted-foreground">主要な感情:</span>{' '}
            <span className="font-medium">{emotionalAnalysis.primary}</span>
          </p>
          {emotionalAnalysis.secondary.length > 0 && (
            <p>
              <span className="text-muted-foreground">副次的な感情:</span>{' '}
              {emotionalAnalysis.secondary.join(', ')}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">強度:</span>
            <div className="h-2 w-32 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${emotionalAnalysis.intensity * 10}%` }}
              />
            </div>
            <span className="text-sm">{emotionalAnalysis.intensity}/10</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">潜在的な意味</h2>
          <TextToSpeechButton
            text={analysis.underlyingMeanings.join('。')}
            size="sm"
            showLabel={false}
          />
        </div>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          {analysis.underlyingMeanings.map((meaning, index) => (
            <li key={index}>{meaning}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">洞察・アドバイス</h2>
          <TextToSpeechButton
            text={analysis.insights.join('。')}
            size="sm"
            showLabel={false}
          />
        </div>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          {analysis.insights.map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
