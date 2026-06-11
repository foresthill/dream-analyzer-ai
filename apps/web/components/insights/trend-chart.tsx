'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/theme-store';

interface TrendChartProps {
  data: Array<{ date: string; count: number }>;
}

function useCSSColor(varName: string, fallback: string) {
  const theme = useThemeStore((s) => s.theme);
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    // Small delay to let the DOM update the CSS variables
    const id = requestAnimationFrame(() => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      if (value) setColor(value);
    });
    return () => cancelAnimationFrame(id);
  }, [varName, theme]);
  return color;
}

export function TrendChart({ data }: TrendChartProps) {
  const primaryColor = useCSSColor('--color-primary', '#6366f1');
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <Tooltip
          labelFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('ja-JP');
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={primaryColor}
          strokeWidth={2}
          dot={{ r: 4 }}
          name="夢の数"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
