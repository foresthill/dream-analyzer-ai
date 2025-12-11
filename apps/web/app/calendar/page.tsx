import { prisma } from '@/lib/db';
import { DreamCalendar } from '@/components/calendar/dream-calendar';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const dreams = await prisma.dream.findMany({
    orderBy: { date: 'desc' },
    include: {
      analyses: true,
      dreamer: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">夢カレンダー</h1>
        <p className="text-muted-foreground">
          カレンダー形式で夢の記録を確認できます
        </p>
      </div>

      <DreamCalendar dreams={dreams} />
    </div>
  );
}
