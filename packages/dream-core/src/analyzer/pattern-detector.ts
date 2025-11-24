import type { Dream, DreamSymbol } from '@dream-analyzer/shared-types';

export interface PatternResult {
  recurringSymbols: Array<{ symbol: string; count: number }>;
  recurringThemes: Array<{ theme: string; count: number }>;
  moodTrend: Array<{ date: string; mood: string }>;
}

export function detectPatterns(dreams: Dream[]): PatternResult {
  const symbolCounts = new Map<string, number>();
  const themeCounts = new Map<string, number>();
  const moodTrend: Array<{ date: string; mood: string }> = [];

  for (const dream of dreams) {
    // Count symbols
    if (dream.analysis?.symbols) {
      for (const symbol of dream.analysis.symbols) {
        const count = symbolCounts.get(symbol.symbol) || 0;
        symbolCounts.set(symbol.symbol, count + 1);
      }
    }

    // Count themes
    if (dream.analysis?.themes) {
      for (const theme of dream.analysis.themes) {
        const count = themeCounts.get(theme) || 0;
        themeCounts.set(theme, count + 1);
      }
    }

    // Track mood
    moodTrend.push({
      date: dream.date.toISOString().split('T')[0],
      mood: dream.mood,
    });
  }

  const recurringSymbols = Array.from(symbolCounts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recurringThemes = Array.from(themeCounts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    recurringSymbols,
    recurringThemes,
    moodTrend: moodTrend.sort((a, b) => a.date.localeCompare(b.date)),
  };
}
