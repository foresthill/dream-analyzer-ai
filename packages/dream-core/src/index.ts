// Analyzer
export { DreamAnalyzer } from './analyzer/dream-analyzer';
export { getMoodColor, getMoodLabel, MOOD_COLORS, MOOD_LABELS } from './analyzer/mood-analyzer';
export { detectPatterns, type PatternResult } from './analyzer/pattern-detector';
export { interpretSymbol, findRelatedSymbols } from './analyzer/symbol-interpreter';

// Symbols
export { SymbolDatabase, SYMBOL_DATABASE } from './symbols/symbol-database';
export { SYMBOL_CATEGORIES, getCategoryLabel, getCategoryIcon } from './symbols/symbol-categories';

// AI
export { buildAnalysisPrompt } from './ai/prompt-builder';
export { parseAnalysisResponse } from './ai/response-parser';
