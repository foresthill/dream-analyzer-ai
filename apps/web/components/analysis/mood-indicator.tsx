import { getMoodColor, getMoodLabel } from '@dream-analyzer/dream-core';
import type { DreamMood } from '@dream-analyzer/shared-types';

interface MoodIndicatorProps {
  mood: DreamMood;
  size?: 'sm' | 'md' | 'lg';
}

export function MoodIndicator({ mood, size = 'md' }: MoodIndicatorProps) {
  const color = getMoodColor(mood);
  const label = getMoodLabel(mood);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded-full ${sizeClasses[size]}`}
        style={{ backgroundColor: color }}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
