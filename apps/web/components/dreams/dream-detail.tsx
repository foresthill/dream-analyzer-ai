import { formatDate } from '@/lib/utils';
import { getMoodLabel } from '@dream-analyzer/dream-core';
import type { DreamMood } from '@dream-analyzer/shared-types';

interface DreamDetailProps {
  dream: {
    id: string;
    title: string;
    content: string;
    date: Date;
    mood: string;
    lucidity: number;
    vividness: number;
    emotionalIntensity: number;
    setting: string | null;
    characters: string[];
    emotions: string[];
  };
}

export function DreamDetail({ dream }: DreamDetailProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dream.title}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(dream.date)}</p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
          {getMoodLabel(dream.mood.toLowerCase() as DreamMood)}
        </span>
      </div>

      <p className="mb-6 whitespace-pre-wrap">{dream.content}</p>

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <div>
          <span className="text-sm text-muted-foreground">明晰度</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${dream.lucidity * 10}%` }}
              />
            </div>
            <span className="text-sm font-medium">{dream.lucidity}</span>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">鮮明度</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${dream.vividness * 10}%` }}
              />
            </div>
            <span className="text-sm font-medium">{dream.vividness}</span>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">感情の強さ</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${dream.emotionalIntensity * 10}%` }}
              />
            </div>
            <span className="text-sm font-medium">{dream.emotionalIntensity}</span>
          </div>
        </div>
      </div>

      {(dream.setting || dream.characters.length > 0 || dream.emotions.length > 0) && (
        <div className="mt-4 border-t border-border pt-4">
          {dream.setting && (
            <p className="text-sm">
              <span className="text-muted-foreground">場所:</span> {dream.setting}
            </p>
          )}
          {dream.characters.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">登場人物:</span>{' '}
              {dream.characters.join(', ')}
            </p>
          )}
          {dream.emotions.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">感情:</span>{' '}
              {dream.emotions.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
