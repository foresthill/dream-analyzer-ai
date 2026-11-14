import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { getMoodColor, getMoodLabel } from '@dream-analyzer/dream-core';
import type { DreamMood } from '@dream-analyzer/shared-types';

interface DreamCardProps {
  dream: {
    id: string;
    title: string;
    content: string;
    date: Date;
    mood: string;
    analyzed: boolean;
  };
}

export function DreamCard({ dream }: DreamCardProps) {
  const moodColor = getMoodColor(dream.mood.toLowerCase() as DreamMood);
  const moodLabel = getMoodLabel(dream.mood.toLowerCase() as DreamMood);

  return (
    <Link
      href={`/dreams/${dream.id}`}
      className="group relative block overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* 上端の藍→紫グラデライン */}
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: 'linear-gradient(90deg, var(--color-primary), #a78bfa)' }}
      />
      <div className="mb-2 mt-1 flex items-start justify-between gap-2">
        <h3 className="font-semibold">{dream.title}</h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: moodColor, color: '#fff' }}
        >
          {moodLabel}
        </span>
      </div>
      <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
        {dream.content}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(dream.date)}</span>
        {dream.analyzed && (
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            ✦ 分析済み
          </span>
        )}
      </div>
    </Link>
  );
}
