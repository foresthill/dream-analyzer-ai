import { notFound } from 'next/navigation';
import { DreamDetail } from '@/components/dreams/dream-detail';
import { AnalysisResult } from '@/components/analysis/analysis-result';
import { AnalyzeButton } from '@/components/dreams/analyze-button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface DreamPageProps {
  params: Promise<{ id: string }>;
}

export default async function DreamPage({ params }: DreamPageProps) {
  const { id } = await params;

  const dream = await prisma.dream.findUnique({
    where: { id },
    include: {
      analyses: {
        orderBy: { analyzedAt: 'desc' },
      },
    },
  });

  if (!dream) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <DreamDetail dream={dream} />

      {/* Analysis control */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">AI分析</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          異なるAIモデルで分析して、結果を比較できます。
        </p>
        <AnalyzeButton dreamId={dream.id} existingAnalyses={dream.analyses} />
      </div>

      {/* Analysis results */}
      {dream.analyses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            分析結果 ({dream.analyses.length}件)
          </h2>
          <div className="space-y-6">
            {dream.analyses.map((analysis, index) => (
              <section
                key={analysis.id}
                className="rounded-lg border-2 border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-lg font-semibold">
                    分析 #{dream.analyses.length - index}
                  </h3>
                  <div className="text-right">
                    <div className="text-sm font-mono text-muted-foreground">
                      {analysis.provider === 'openrouter' ? 'OpenRouter / ' : ''}
                      {analysis.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(analysis.analyzedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                    </div>
                  </div>
                </div>
                <AnalysisResult analysis={analysis} />
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
