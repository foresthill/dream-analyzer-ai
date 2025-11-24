import { prisma } from '@/lib/db';
import { TrendChart } from '@/components/insights/trend-chart';
import { SymbolFrequency } from '@/components/insights/symbol-frequency';

export default async function InsightsPage() {
  const dreams = await prisma.dream.findMany({
    orderBy: { date: 'desc' },
    take: 100,
    include: { analysis: true },
  });

  // Calculate mood distribution
  const moodCounts = dreams.reduce(
    (acc, dream) => {
      acc[dream.mood] = (acc[dream.mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate dream frequency by week
  const frequencyByDate = dreams.reduce(
    (acc, dream) => {
      const date = dream.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const dreamFrequency = Object.entries(frequencyByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate symbol frequency from analyses
  const symbolCounts = new Map<string, number>();
  for (const dream of dreams) {
    if (dream.analysis?.symbols) {
      const symbols = dream.analysis.symbols as Array<{ symbol: string }>;
      for (const { symbol } of symbols) {
        symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
      }
    }
  }

  const topSymbols = Array.from(symbolCounts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">インサイト</h1>
        <p className="text-muted-foreground">
          あなたの夢のパターンと傾向を分析します
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-4 text-lg font-semibold">夢の記録頻度</h2>
          <TrendChart data={dreamFrequency} />
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-4 text-lg font-semibold">よく出現するシンボル</h2>
          <SymbolFrequency symbols={topSymbols} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <h2 className="mb-4 text-lg font-semibold">気分の分布</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(moodCounts).map(([mood, count]) => (
            <div
              key={mood}
              className="rounded-lg bg-secondary px-3 py-2 text-sm"
            >
              <span className="font-medium">{mood}</span>
              <span className="ml-2 text-muted-foreground">{count}回</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
