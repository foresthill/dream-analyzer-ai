import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-14 items-center px-4">
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
