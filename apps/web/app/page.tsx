import Link from 'next/link';
import { DreamList } from '@/components/dreams/dream-list';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">夢日記</h1>
          <p className="text-muted-foreground">あなたの夢を記録し、分析しましょう</p>
        </div>
        <Link
          href="/dreams/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          新しい夢を記録
        </Link>
      </div>
      <DreamList />
    </div>
  );
}
