'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DreamForm } from '@/components/dreams/dream-form';
import { AnalysisLoading } from '@/components/analysis/analysis-loading';
import { useSettingsStore } from '@/store/settings-store';
import type { CreateDreamInput } from '@dream-analyzer/shared-types';
import { streamAnalysis } from '@/lib/analyze-stream-client';

type Phase = 'form' | 'analyzing' | 'finishing' | 'error';

export default function NewDreamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [streamText, setStreamText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedDreamId, setSavedDreamId] = useState<string | null>(null);
  const [isPartial, setIsPartial] = useState(false);
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
      setSavedDreamId(data.id);

      // 2. AI解析を開始する場合（ストリーミングで逐次表示）
      if (startAnalysis) {
        setPhase('analyzing');
        setStreamText('');
        const result = await streamAnalysis(
          {
            dreamId: data.id,
            provider: modelConfig.provider,
            model: modelConfig.model,
          },
          (text) => setStreamText(text)
        );

        // 分析が最後まで完了しなかった場合は、黙って遷移せずに知らせる。
        // 夢そのものは保存済みなので、詳細ページから分析だけやり直せる。
        if (!result.ok) {
          setIsPartial(false);
          setErrorMessage(
            result.error ||
              '分析が時間内に完了しませんでした。朝など久しぶりの最初の1回目は時間がかかることがあります。'
          );
          setPhase('error');
          setIsSubmitting(false);
          return;
        }

        // 時間切れで途中保存された場合。本文は途中まで・メタ情報（シンボル等）は
        // 空のことが多いので、黙って遷移せず「途中保存」であることを知らせる。
        if (result.partial) {
          setIsPartial(true);
          setErrorMessage(
            '時間内に生成が終わらず、途中までの内容で保存しました（シンボルやテーマなどが欠けていることがあります）。より速いモデル（例: Sonnet系）でやり直すと、最後まで入ることが多いです。'
          );
          setPhase('error');
          setIsSubmitting(false);
          return;
        }
      }

      // 「完了→遷移中」の表示にしたまま詳細ページへ。
      // ここでフォーム表示に戻すと一瞬フォームがちらつくため、phase は戻さない。
      setPhase('finishing');
      router.push(`/dreams/${data.id}`);
    } catch (error) {
      console.error('Error creating dream:', error);
      // 夢の保存自体は済んでいる可能性があるため、保存済みなら詳細への導線を出す。
      if (savedDreamId) {
        setErrorMessage('分析の呼び出しでエラーが発生しました。夢は保存済みです。');
        setPhase('error');
      } else {
        alert('夢の記録に失敗しました');
        setPhase('form');
      }
      setIsSubmitting(false);
    }
  };

  // 分析が完了しなかった場合。夢は保存済みなので、やり直し導線を出す。
  if (phase === 'error') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">夢を記録しました</h1>
          <p className="text-muted-foreground">
            {isPartial ? '分析は途中までの内容で保存されています。' : '分析だけが完了しませんでした。'}
          </p>
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">夢は保存されています（消えていません）。</p>
          <p className="mt-1 whitespace-pre-wrap">{errorMessage}</p>
          <p className="mt-2 text-amber-800 dark:text-amber-300/80">
            詳細ページから、もう一度分析を実行できます。2回目以降は速くなることが多いです。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {savedDreamId && (
            <button
              type="button"
              onClick={() => {
                setPhase('finishing');
                router.push(`/dreams/${savedDreamId}`);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {isPartial ? '途中までの結果を見る（やり直しも可）' : '記録した夢を開いて分析をやり直す'}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/dreams')}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            夢の一覧へ
          </button>
        </div>
      </div>
    );
  }

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
