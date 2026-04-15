'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DreamForm } from '@/components/dreams/dream-form';
import { AnalysisLoading } from '@/components/analysis/analysis-loading';
import { useSettingsStore } from '@/store/settings-store';
import type { CreateDreamInput } from '@dream-analyzer/shared-types';

export default function NewDreamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

      // 2. AI解析を開始する場合
      if (startAnalysis) {
        setIsAnalyzing(true);
        // AI解析APIを呼び出し
        const analyzeResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dreamId: data.id,
            provider: modelConfig.provider,
            model: modelConfig.model,
          }),
        });

        if (!analyzeResponse.ok) {
          // 解析失敗でも夢は保存済みなので詳細ページへ
          console.error('Analysis failed, but dream was saved');
        }
      }

      // 詳細ページへ遷移
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
            夢が保存されました。AI分析を実行中です...
          </p>
        </div>
        <AnalysisLoading />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">夢を記録</h1>
        <p className="text-muted-foreground">
          夢の内容を入力してください
        </p>
      </div>
      <DreamForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
