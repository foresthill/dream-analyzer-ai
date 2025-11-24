import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { InsightData } from '@dream-analyzer/shared-types';

// GET /api/insights - Get user insights
export async function GET() {
  try {
    const dreams = await prisma.dream.findMany({
      orderBy: { date: 'desc' },
      include: { analysis: true },
    });

    // Calculate mood distribution
    const moodDistribution = dreams.reduce(
      (acc, dream) => {
        const mood = dream.mood.toLowerCase();
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate symbol frequency
    const symbolCounts = new Map<string, number>();
    for (const dream of dreams) {
      if (dream.analysis?.symbols) {
        const symbols = dream.analysis.symbols as Array<{ symbol: string }>;
        for (const { symbol } of symbols) {
          symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
        }
      }
    }

    const commonSymbols = Array.from(symbolCounts.entries())
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate theme frequency
    const themeCounts = new Map<string, number>();
    for (const dream of dreams) {
      if (dream.analysis?.themes) {
        for (const theme of dream.analysis.themes) {
          themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
        }
      }
    }

    const commonThemes = Array.from(themeCounts.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate averages
    const totalLucidity = dreams.reduce((sum, d) => sum + d.lucidity, 0);
    const totalVividness = dreams.reduce((sum, d) => sum + d.vividness, 0);
    const averageLucidity = dreams.length > 0 ? totalLucidity / dreams.length : 0;
    const averageVividness = dreams.length > 0 ? totalVividness / dreams.length : 0;

    // Calculate dream frequency by date
    const frequencyMap = dreams.reduce(
      (acc, dream) => {
        const date = dream.date.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const dreamFrequency = Object.entries(frequencyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const insights: InsightData = {
      totalDreams: dreams.length,
      moodDistribution,
      commonSymbols,
      commonThemes,
      averageLucidity,
      averageVividness,
      dreamFrequency,
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
