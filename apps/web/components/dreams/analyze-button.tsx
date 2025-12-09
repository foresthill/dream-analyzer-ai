'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/settings-store';

interface Analysis {
  id: string;
  provider: string;
  model: string;
  analyzedAt: Date;
}

interface AnalyzeButtonProps {
  dreamId: string;
  existingAnalyses: Analysis[];
}

export function AnalyzeButton({ dreamId, existingAnalyses }: AnalyzeButtonProps) {
  const router = useRouter();
  const { modelConfig } = useSettingsStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current model combination already exists
  const alreadyAnalyzed = existingAnalyses.some(
    (a) => a.provider === modelConfig.provider && a.model === modelConfig.model
  );

  const handleAnalyze = async () => {
    if (alreadyAnalyzed) {
      if (!confirm('このモデルで既に分析済みです。再分析しますか？')) {
        return;
      }
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamId,
          provider: modelConfig.provider,
          model: modelConfig.model,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze dream');
      }

      // Refresh the page to show the new analysis
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze dream');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing analyses */}
      {existingAnalyses.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium">既存の分析:</h3>
          <div className="space-y-2">
            {existingAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm"
              >
                <div className="font-mono">
                  {analysis.provider === 'openrouter' ? 'OpenRouter / ' : ''}
                  {analysis.model}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(analysis.analyzedAt).toLocaleString('ja-JP')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`rounded-lg px-6 py-3 font-semibold transition-colors ${
            isAnalyzing
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : alreadyAnalyzed
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              分析中...
            </span>
          ) : alreadyAnalyzed ? (
            '再分析する'
          ) : existingAnalyses.length > 0 ? (
            '別モデルで分析'
          ) : (
            '夢を分析する'
          )}
        </button>

        <div className="text-sm text-muted-foreground">
          使用モデル: {modelConfig.provider === 'openrouter' ? 'OpenRouter / ' : ''}
          {modelConfig.model}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-600">
          AIが夢を分析しています。完了までお待ちください...
        </div>
      )}
    </div>
  );
}
