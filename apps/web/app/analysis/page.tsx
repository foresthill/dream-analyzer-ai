import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AnalysisPage() {
  const recentAnalyses = await prisma.dreamAnalysis.findMany({
    take: 20,
    orderBy: { analyzedAt: 'desc' },
    include: {
      dream: {
        select: {
          id: true,
          title: true,
          date: true,
          mood: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">分析履歴</h1>
        <p className="text-muted-foreground">過去の夢分析結果を確認できます</p>
      </div>

      <div className="space-y-4">
        {recentAnalyses.length === 0 ? (
          <p className="text-muted-foreground">まだ分析された夢がありません</p>
        ) : (
          recentAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{analysis.dream.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(analysis.analyzedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {analysis.psychologicalInterpretation}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {analysis.themes.slice(0, 3).map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
