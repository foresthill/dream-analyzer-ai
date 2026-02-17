'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const navigation = [
  { name: '夢日記', href: '/', icon: '📔' },
  { name: 'カレンダー', href: '/calendar', icon: '📅' },
  { name: '分析履歴', href: '/analysis', icon: '🔍' },
  { name: 'インサイト', href: '/insights', icon: '📊' },
  { name: 'シンボル辞典', href: '/symbols', icon: '📖' },
  { name: '夢を見た人', href: '/dreamers', icon: '👥' },
  { name: '共有された夢', href: '/shared/with-me', icon: '🔗' },
  { name: '共有した夢', href: '/shared/by-me', icon: '📤' },
  { name: '設定', href: '/settings', icon: '⚙️' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  const navContent = (
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
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 border-r border-border bg-background md:block">
        {navContent}
      </aside>

      {/* Mobile sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="text-lg font-bold">メニュー</span>
              <button
                onClick={onClose}
                className="rounded-md p-2 hover:bg-secondary"
                aria-label="メニューを閉じる"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
