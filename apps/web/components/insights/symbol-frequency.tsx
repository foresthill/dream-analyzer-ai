'use client';

interface SymbolFrequencyProps {
  symbols: Array<{ symbol: string; count: number }>;
}

export function SymbolFrequency({ symbols }: SymbolFrequencyProps) {
  if (symbols.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        データがありません
      </div>
    );
  }

  const maxCount = Math.max(...symbols.map((s) => s.count));
  const minCount = Math.min(...symbols.map((s) => s.count));
  const range = maxCount - minCount || 1;

  // 出現回数に応じてフォントサイズ (0.75rem〜2.25rem) を決定
  const getFontSize = (count: number) => {
    const ratio = (count - minCount) / range;
    return 0.75 + ratio * 1.5;
  };

  // 出現回数に応じて透明度 (0.5〜1.0) を決定
  const getOpacity = (count: number) => {
    const ratio = (count - minCount) / range;
    return 0.5 + ratio * 0.5;
  };

  return (
    <div className="flex min-h-[12rem] flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4">
      {symbols.map(({ symbol, count }) => (
        <span
          key={symbol}
          className="inline-block cursor-default rounded-md px-1.5 py-0.5 font-medium text-primary transition-transform hover:scale-110"
          style={{
            fontSize: `${getFontSize(count)}rem`,
            opacity: getOpacity(count),
          }}
          title={`${symbol}: ${count}回`}
        >
          {symbol}
        </span>
      ))}
    </div>
  );
}
