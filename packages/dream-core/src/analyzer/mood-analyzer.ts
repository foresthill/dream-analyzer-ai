import type { DreamMood } from '@dream-analyzer/shared-types';

export const MOOD_COLORS: Record<DreamMood, string> = {
  joyful: '#FFD700',
  peaceful: '#87CEEB',
  anxious: '#FFA500',
  fearful: '#8B0000',
  sad: '#4682B4',
  angry: '#DC143C',
  confused: '#9370DB',
  excited: '#FF69B4',
  neutral: '#808080',
};

export const MOOD_LABELS: Record<DreamMood, string> = {
  joyful: '喜び',
  peaceful: '穏やか',
  anxious: '不安',
  fearful: '恐怖',
  sad: '悲しみ',
  angry: '怒り',
  confused: '混乱',
  excited: '興奮',
  neutral: '中立',
};

export function getMoodColor(mood: DreamMood): string {
  return MOOD_COLORS[mood] || MOOD_COLORS.neutral;
}

export function getMoodLabel(mood: DreamMood): string {
  return MOOD_LABELS[mood] || '不明';
}
