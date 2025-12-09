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
    include: { analysis: true },
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
        <AnalyzeButton dreamId={dream.id} hasAnalysis={!!dream.analysis} />
      </div>

      {/* Analysis results */}
      {dream.analysis && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">分析結果</h2>
          <AnalysisResult analysis={dream.analysis} />
        </div>
      )}
    </div>
  );
}
