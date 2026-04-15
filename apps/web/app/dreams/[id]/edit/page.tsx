'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DreamForm } from '@/components/dreams/dream-form';
import { AnalysisLoading } from '@/components/analysis/analysis-loading';
import { useSettingsStore } from '@/store/settings-store';
import type { CreateDreamInput, DreamMood } from '@dream-analyzer/shared-types';
import type { DreamFormInitialData } from '@/components/dreams/dream-form';

interface DreamData {
  id: string;
  dreamerId: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  lucidity: number;
  vividness: number;
  emotionalIntensity: number;
  setting: string | null;
  characters: string[];
  emotions: string[];
  analyses: { id: string }[];
}

export default function EditDreamPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dream, setDream] = useState<DreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { modelConfig, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const fetchDream = async () => {
      try {
        const response = await fetch(`/api/dreams/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dream');
        }
        const data = await response.json();
        setDream(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dream');
      } finally {
        setLoading(false);
      }
    };

    fetchDream();
  }, [id]);

  const handleSubmit = async (dreamInput: CreateDreamInput & { dreamerId: string }, startAnalysis: boolean) => {
    setIsSubmitting(true);
    try {
      // 1. 夢を更新
      const response = await fetch(`/api/dreams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dreamInput),
      });

      if (!response.ok) {
        throw new Error('Failed to update dream');
      }

      const data = await response.json();

      // 2. AI再解析を開始する場合
      if (startAnalysis) {
        setIsAnalyzing(true);
        const analyzeResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dreamId: id,
            provider: modelConfig.provider,
            model: modelConfig.model,
          }),
        });

        if (!analyzeResponse.ok) {
          console.error('Re-analysis failed, but dream was updated');
        }
      }

      // 詳細ページへ遷移
      router.push(`/dreams/${id}`);
    } catch (err) {
      console.error('Error updating dream:', err);
      alert('夢の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">夢を編集</h1>
          <p className="text-muted-foreground">
            夢が更新されました。AI再分析を実行中です...
          </p>
        </div>
        <AnalysisLoading />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (error || !dream) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600">
          {error || '夢が見つかりませんでした'}
        </div>
      </div>
    );
  }

  const initialData: DreamFormInitialData = {
    dreamerId: dream.dreamerId,
    title: dream.title,
    content: dream.content,
    date: new Date(dream.date).toISOString().split('T')[0],
    mood: dream.mood.toLowerCase() as DreamMood,
    lucidity: dream.lucidity,
    vividness: dream.vividness,
    emotionalIntensity: dream.emotionalIntensity,
    setting: dream.setting ?? '',
    characters: dream.characters.join(', '),
    emotions: dream.emotions.join(', '),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">夢を編集</h1>
        <p className="text-muted-foreground">
          内容を修正すると、既存の分析結果は削除され再分析できます。
        </p>
        {dream.analyses.length > 0 && (
          <p className="mt-1 text-sm text-yellow-600">
            現在 {dream.analyses.length} 件の分析結果があります。内容を変更すると削除されます。
          </p>
        )}
      </div>
      <DreamForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        initialData={initialData}
        mode="edit"
      />
    </div>
  );
}
