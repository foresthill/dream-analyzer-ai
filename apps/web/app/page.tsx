import { DreamList } from '@/components/dreams/dream-list';
import { DreamHero } from '@/components/home/dream-hero';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <DreamHero />

      <div>
        <div className="mb-4 flex items-baseline justify-between px-0.5">
          <h2 className="text-xl font-bold">最近の夢</h2>
        </div>
        <DreamList />
      </div>
    </div>
  );
}
