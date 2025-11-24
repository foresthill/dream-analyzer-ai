'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={symbols} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" fontSize={12} />
        <YAxis
          dataKey="symbol"
          type="category"
          width={80}
          fontSize={12}
        />
        <Tooltip />
        <Bar dataKey="count" fill="#6366f1" name="出現回数" />
      </BarChart>
    </ResponsiveContainer>
  );
}
