export interface SymbolEntry {
  symbol: string;
  category: string;
  interpretations: {
    general: string;
    positive: string;
    negative: string;
    cultural?: string;
  };
  relatedSymbols: string[];
  keywords: string[];
}

export interface SymbolSearchResult {
  symbol: string;
  category: string;
  interpretation: string;
  relevance: number;
}
