'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: '夢日記', href: '/', icon: '📔' },
  { name: '分析履歴', href: '/analysis', icon: '🔍' },
  { name: 'インサイト', href: '/insights', icon: '📊' },
  { name: 'シンボル辞典', href: '/symbols', icon: '📖' },
  { name: '設定', href: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 border-r border-border bg-background md:block">
      <nav className="space-y-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
              pathname === item.href
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <span>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
