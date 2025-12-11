import { prisma } from '@/lib/db';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

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
            <Link
              key={analysis.id}
              href={`/dreams/${analysis.dream.id}`}
              className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{analysis.dream.title}</h3>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{formatDate(analysis.dream.date)}</div>
                  <div className="text-xs">
                    分析: {new Date(analysis.analyzedAt).toLocaleString('ja-JP', {
                      timeZone: 'Asia/Tokyo',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
              <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                {analysis.psychologicalInterpretation}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-wrap gap-1">
                  {analysis.themes.slice(0, 3).map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
                <span className="ml-auto text-xs font-mono text-muted-foreground">
                  {analysis.provider === 'openrouter' ? 'OpenRouter / ' : ''}
                  {analysis.model}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
