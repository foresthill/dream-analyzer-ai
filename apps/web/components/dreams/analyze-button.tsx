'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AVAILABLE_MODELS, useSettingsStore, type AIProvider } from '@/store/settings-store';
import { AnalysisLoading } from '@/components/analysis/analysis-loading';

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

// 表示用: 最初のコードフェンス（```）以降（＝保存用JSON）を隠し、読みやすい本文だけを見せる
function stripJson(text: string): string {
  const fence = text.indexOf('```');
  return (fence === -1 ? text : text.slice(0, fence)).trim();
}

export function AnalyzeButton({ dreamId, existingAnalyses }: AnalyzeButtonProps) {
  const router = useRouter();
  const { modelConfig } = useSettingsStore();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('anthropic');
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS.anthropic[0].value);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 設定ストアからデフォルト値を初期化（ハイドレーション対策）
  useEffect(() => {
    if (!isInitialized) {
      setSelectedProvider(modelConfig.provider);
      setSelectedModel(modelConfig.model);
      setIsInitialized(true);
    }
  }, [modelConfig, isInitialized]);

  // Check if current model combination already exists
  const alreadyAnalyzed = existingAnalyses.some(
    (a) => a.provider === selectedProvider && a.model === selectedModel
  );

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setSelectedModel(AVAILABLE_MODELS[provider][0].value);
  };

  const handleAnalyze = async () => {
    if (alreadyAnalyzed) {
      if (!confirm('このモデルで既に分析済みです。再分析しますか？')) {
        return;
      }
    }

    setIsAnalyzing(true);
    setError(null);
    setStreamText('');

    try {
      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamId,
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      // ストリーム開始前のエラー（認証・APIキー未設定など）はJSONで返る
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        const base = data.error || `分析に失敗しました（HTTP ${response.status}）`;
        throw new Error(data.detail ? `${base}\n詳細: ${data.detail}` : base);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      let streamError: string | null = null;
      let finished = false;

      while (!finished) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let msg: { type?: string; text?: string; error?: string; detail?: string };
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          if (msg.type === 'delta') {
            full += msg.text ?? '';
            setStreamText(stripJson(full));
          } else if (msg.type === 'done') {
            finished = true;
          } else if (msg.type === 'error') {
            streamError = msg.detail ? `${msg.error}\n詳細: ${msg.detail}` : (msg.error ?? '分析に失敗しました');
            finished = true;
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      // 保存済みの構造化分析を表示するためにページを更新
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析に失敗しました（原因不明）');
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
                  {new Date(analysis.analyzedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model selection */}
      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="mb-3 text-sm font-medium">分析に使用するモデルを選択:</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="provider" className="mb-1 block text-xs font-medium text-muted-foreground">
              プロバイダー
            </label>
            <select
              id="provider"
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
          <div>
            <label htmlFor="model" className="mb-1 block text-xs font-medium text-muted-foreground">
              モデル
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {AVAILABLE_MODELS[selectedProvider].map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analyze button */}
      <div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
            isAnalyzing
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : alreadyAnalyzed
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
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
      </div>

      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {isAnalyzing && (
        streamText ? (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">分析中（リアルタイム表示）…</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {streamText}
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-text-bottom" />
            </div>
          </div>
        ) : (
          <AnalysisLoading />
        )
      )}
    </div>
  );
}
