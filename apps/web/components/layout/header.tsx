'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session, status } = useSession();

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
          {session && (
            <Link
              href="/dreams/new"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              夢を記録
            </Link>
          )}

          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground md:block">
                {session.user?.name}
              </span>
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'ユーザー'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              ログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
