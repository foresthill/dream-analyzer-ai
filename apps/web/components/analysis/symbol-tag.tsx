import { getCategoryIcon, getCategoryLabel } from '@dream-analyzer/dream-core';

interface SymbolTagProps {
  symbol: string;
  category: string;
}

export function SymbolTag({ symbol, category }: SymbolTagProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-sm">
      <span>{getCategoryIcon(category)}</span>
      <span className="font-medium">{symbol}</span>
      <span className="text-xs text-muted-foreground">
        ({getCategoryLabel(category)})
      </span>
    </span>
  );
}
