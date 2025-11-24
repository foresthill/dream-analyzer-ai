import type { DreamSymbol, SymbolCategory } from '@dream-analyzer/shared-types';
import { SymbolDatabase } from '../symbols/symbol-database';

export function interpretSymbol(symbolName: string): DreamSymbol | null {
  const results = SymbolDatabase.search(symbolName);

  if (results.length === 0) {
    return null;
  }

  const entry = results[0];
  return {
    symbol: entry.symbol,
    category: entry.category as SymbolCategory,
    interpretation: entry.interpretations.general,
    culturalContext: entry.interpretations.cultural,
  };
}

export function findRelatedSymbols(symbolName: string): string[] {
  const results = SymbolDatabase.search(symbolName);

  if (results.length === 0) {
    return [];
  }

  return results[0].relatedSymbols;
}
