'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DreamForm } from '@/components/dreams/dream-form';
import { AnalysisLoading } from '@/components/analysis/analysis-loading';
import { useSettingsStore } from '@/store/settings-store';
import type { CreateDreamInput } from '@dream-analyzer/shared-types';
import { streamAnalysis } from '@/lib/analyze-stream-client';

export default function NewDreamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamText, setStreamText] = useState('');
  const { modelConfig, fetchSettings } = useSettingsStore();

  // ページ読み込み時にサーバーから設定を取得
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (dream: CreateDreamInput, startAnalysis: boolean) => {
    setIsSubmitting(true);
    try {
      // 1. 夢を保存
      const response = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dream),
      });

      if (!response.ok) {
        throw new Error('Failed to create dream');
      }

      const data = await response.json();

      // 2. AI解析を開始する場合（ストリーミングで逐次表示）
      if (startAnalysis) {
        setIsAnalyzing(true);
        setStreamText('');
        // 失敗しても夢は保存済みなので、結果に関わらず詳細ページへ遷移する
        await streamAnalysis(
          {
            dreamId: data.id,
            provider: modelConfig.provider,
            model: modelConfig.model,
          },
          (text) => setStreamText(text)
        );
      }

      // 詳細ページへ遷移（保存済みの構造化分析を表示）
      router.push(`/dreams/${data.id}`);
    } catch (error) {
      console.error('Error creating dream:', error);
      alert('夢の記録に失敗しました');
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">夢を記録</h1>
          <p className="text-muted-foreground">
            夢が保存されました。AIが分析しています…
          </p>
        </div>
        {streamText ? (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">分析中（リアルタイム表示）…</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {streamText}
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-text-bottom" />
            </div>
          </div>
        ) : (
          <AnalysisLoading />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">夢を記録</h1>
      <DreamForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
