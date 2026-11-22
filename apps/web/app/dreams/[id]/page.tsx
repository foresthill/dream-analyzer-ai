import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { DreamDetail } from '@/components/dreams/dream-detail';
import { AnalysisResult } from '@/components/analysis/analysis-result';
import { AnalysisChat } from '@/components/analysis/analysis-chat';
import { AnalyzeButton } from '@/components/dreams/analyze-button';
import { ShareButton } from '@/components/sharing/share-button';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

interface DreamPageProps {
  params: Promise<{ id: string }>;
}

export default async function DreamPage({ params }: DreamPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

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

  // Check ownership - redirect if not owner
  if (dream.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* 上部: 夢のタイトル＋日付＋操作ボタン（本文は一番下に収納） */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{dream.title}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(dream.date)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/dreams/${dream.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            編集
          </Link>
          <ShareButton dreamId={dream.id} targetLabel={dream.title} />
        </div>
      </div>

      {/* 分析結果（最優先・上に表示。各結果の下にその結果へのチャット） */}
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

                {/* この分析結果に対するチャット */}
                <div className="mt-6 border-t border-border pt-6">
                  <AnalysisChat analysisId={analysis.id} />
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* AI分析コントロール（結果の下。別モデルで再分析・比較） */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">AI分析</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          異なるAIモデルで分析して、結果を比較できます。
        </p>
        <AnalyzeButton dreamId={dream.id} existingAnalyses={dream.analyses} />
      </div>

      {/* 入力した夢の内容（一番下に収納。タップで開く） */}
      <details className="group rounded-lg border border-border bg-background">
        <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-muted-foreground hover:bg-accent/50">
          <span>入力した夢の内容を見る</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
        </summary>
        <div className="border-t border-border p-2">
          <DreamDetail dream={dream} hideHeader />
        </div>
      </details>
    </div>
  );
}
