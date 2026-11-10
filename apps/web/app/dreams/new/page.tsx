'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DreamForm } from '@/components/dreams/dream-form';
import { AnalysisLoading } from '@/components/analysis/analysis-loading';
import { useSettingsStore } from '@/store/settings-store';
import type { CreateDreamInput } from '@dream-analyzer/shared-types';
import { streamAnalysis } from '@/lib/analyze-stream-client';

type Phase = 'form' | 'analyzing' | 'finishing';

export default function NewDreamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
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
        setPhase('analyzing');
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

      // 「完了→遷移中」の表示にしたまま詳細ページへ。
      // ここでフォーム表示に戻すと一瞬フォームがちらつくため、phase は戻さない。
      setPhase('finishing');
      router.push(`/dreams/${data.id}`);
    } catch (error) {
      console.error('Error creating dream:', error);
      alert('夢の記録に失敗しました');
      setPhase('form');
      setIsSubmitting(false);
    }
  };

  // 分析中・遷移中はオーバーレイ表示を保ち、フォームへは戻さない（ちらつき防止）
  if (phase === 'analyzing' || phase === 'finishing') {
    const finishing = phase === 'finishing';
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">夢を記録</h1>
          <p className="text-muted-foreground">
            {finishing ? '分析が完了しました。結果を表示します…' : '夢が保存されました。AIが分析しています…'}
          </p>
        </div>
        {streamText ? (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {finishing ? '分析結果' : '分析中（リアルタイム表示）…'}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {streamText}
              {!finishing && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-text-bottom" />
              )}
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
