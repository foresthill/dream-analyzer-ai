import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import type { InsightData } from '@dream-analyzer/shared-types';

// GET /api/insights - Get user insights
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dreams = await prisma.dream.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      include: {
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 1, // Only get the latest analysis per dream
        },
      },
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

    // Calculate symbol frequency (from latest analysis of each dream)
    const symbolCounts = new Map<string, number>();
    for (const dream of dreams) {
      const latestAnalysis = dream.analyses[0]; // Get latest analysis
      if (latestAnalysis?.symbols) {
        const symbols = latestAnalysis.symbols as Array<{ symbol: string }>;
        for (const { symbol } of symbols) {
          symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
        }
      }
    }

    const commonSymbols = Array.from(symbolCounts.entries())
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate theme frequency (from latest analysis of each dream)
    const themeCounts = new Map<string, number>();
    for (const dream of dreams) {
      const latestAnalysis = dream.analyses[0]; // Get latest analysis
      if (latestAnalysis?.themes) {
        for (const theme of latestAnalysis.themes) {
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
