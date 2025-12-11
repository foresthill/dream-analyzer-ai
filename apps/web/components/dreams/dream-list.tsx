import { prisma } from '@/lib/db';
import { DreamCard } from './dream-card';

export async function DreamList() {
  const dreams = await prisma.dream.findMany({
    orderBy: { date: 'desc' },
    take: 20,
    include: { analyses: true, dreamer: true },
  });

  if (dreams.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <p className="text-muted-foreground">まだ夢が記録されていません</p>
        <p className="mt-2 text-sm text-muted-foreground">
          「新しい夢を記録」ボタンをクリックして、最初の夢を記録しましょう
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {dreams.map((dream) => (
        <DreamCard key={dream.id} dream={dream} />
      ))}
    </div>
  );
}
