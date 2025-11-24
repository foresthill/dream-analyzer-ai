import { notFound } from 'next/navigation';
import { DreamDetail } from '@/components/dreams/dream-detail';
import { AnalysisResult } from '@/components/analysis/analysis-result';
import { prisma } from '@/lib/db';

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
      {dream.analysis && <AnalysisResult analysis={dream.analysis} />}
    </div>
  );
}
