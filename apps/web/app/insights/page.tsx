import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TrendChart } from '@/components/insights/trend-chart';
import { SymbolFrequency } from '@/components/insights/symbol-frequency';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const dreams = await prisma.dream.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 100,
    include: {
      analyses: {
        orderBy: { analyzedAt: 'desc' },
        take: 1, // Only get the latest analysis per dream
      },
    },
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

  // Calculate symbol frequency from latest analyses
  const symbolCounts = new Map<string, number>();
  for (const dream of dreams) {
    const latestAnalysis = dream.analyses[0]; // Get latest analysis
    if (latestAnalysis?.symbols) {
      const symbols = latestAnalysis.symbols as Array<{ symbol: string }>;
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
