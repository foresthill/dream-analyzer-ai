'use client';

import { useState } from 'react';
import { SymbolDatabase, SYMBOL_CATEGORIES, getCategoryLabel } from '@dream-analyzer/dream-core';

export default function SymbolsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allSymbols = SymbolDatabase.getAll();

  const filteredSymbols = allSymbols.filter((symbol) => {
    const matchesCategory = !selectedCategory || symbol.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      symbol.symbol.includes(searchQuery) ||
      symbol.keywords.some((k) => k.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">シンボル辞典</h1>
        <p className="text-muted-foreground">
          夢に現れるシンボルの意味を探索しましょう
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="シンボルを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1 text-sm ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
          >
            すべて
          </button>
          {SYMBOL_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-3 py-1 text-sm ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              }`}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSymbols.map((symbol) => (
          <div
            key={symbol.symbol}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{symbol.symbol}</h3>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                {getCategoryLabel(symbol.category)}
              </span>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">
              {symbol.interpretations.general}
            </p>
            <div className="space-y-1 text-xs">
              <p>
                <span className="text-green-600">ポジティブ:</span>{' '}
                {symbol.interpretations.positive}
              </p>
              <p>
                <span className="text-red-600">ネガティブ:</span>{' '}
                {symbol.interpretations.negative}
              </p>
              {symbol.interpretations.cultural && (
                <p>
                  <span className="text-blue-600">文化的背景:</span>{' '}
                  {symbol.interpretations.cultural}
                </p>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {symbol.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
