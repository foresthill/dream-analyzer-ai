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
      className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary/50"
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold">{dream.title}</h3>
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: moodColor, color: '#fff' }}
        >
          {moodLabel}
        </span>
      </div>
      <p className="mb-2 line-clamp-3 text-sm text-muted-foreground">
        {dream.content}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(dream.date)}</span>
        {dream.analyzed && (
          <span className="text-primary">分析済み</span>
        )}
      </div>
    </Link>
  );
}
