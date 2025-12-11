'use client';

import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-14 items-center px-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="mr-2 rounded-md p-2 hover:bg-secondary md:hidden"
          aria-label="メニューを開く"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🌙</span>
          <span className="text-lg font-bold">Dream Analyzer</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link
            href="/dreams/new"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            夢を記録
          </Link>
        </nav>
      </div>
    </header>
  );
}
