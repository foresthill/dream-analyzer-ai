'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DreamForm } from '@/components/dreams/dream-form';
import { useSettingsStore } from '@/store/settings-store';
import type { CreateDreamInput } from '@dream-analyzer/shared-types';

export default function NewDreamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { modelConfig } = useSettingsStore();

  const handleSubmit = async (dream: CreateDreamInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dream,
          provider: modelConfig.provider,
          model: modelConfig.model,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dream');
      }

      const data = await response.json();
      router.push(`/dreams/${data.id}`);
    } catch (error) {
      console.error('Error creating dream:', error);
      alert('夢の記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">夢を記録</h1>
        <p className="text-muted-foreground">
          夢の内容をできるだけ詳しく記録してください
        </p>
      </div>
      <DreamForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
