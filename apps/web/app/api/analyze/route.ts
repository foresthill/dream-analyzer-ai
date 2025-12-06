import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DreamAnalyzer } from '@dream-analyzer/dream-core';

// POST /api/analyze - Analyze a dream
export async function POST(request: Request) {
  try {
    const { dreamId, provider: userProvider, model: userModel } = await request.json();

    if (!dreamId) {
      return NextResponse.json(
        { error: 'Dream ID is required' },
        { status: 400 }
      );
    }

    // Get the dream
    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
    });

    if (!dream) {
      return NextResponse.json(
        { error: 'Dream not found' },
        { status: 404 }
      );
    }

    // Get AI provider configuration
    // Priority: user selection > environment variable > default
    const provider = (userProvider || process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openrouter';
    const apiKey = provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENROUTER_API_KEY;
    const model = userModel || process.env.AI_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENROUTER_API_KEY'} is not configured` },
        { status: 500 }
      );
    }

    // Analyze the dream
    const analyzer = new DreamAnalyzer({
      provider,
      apiKey,
      model,
    });
    const result = await analyzer.analyze({
      dream: {
        title: dream.title,
        content: dream.content,
        mood: dream.mood.toLowerCase(),
        emotions: dream.emotions,
        setting: dream.setting || undefined,
        characters: dream.characters,
      },
    });

    // Save the analysis
    const analysis = await prisma.dreamAnalysis.create({
      data: {
        dreamId: dream.id,
        psychologicalInterpretation: result.psychologicalInterpretation,
        symbols: result.symbols,
        themes: result.themes,
        emotionalAnalysis: result.emotionalAnalysis,
        underlyingMeanings: result.underlyingMeanings,
        insights: result.insights,
        relatedDreams: [],
        provider,
        model: analyzer['model'], // Get the actual model used from analyzer
      },
    });

    // Mark dream as analyzed
    await prisma.dream.update({
      where: { id: dreamId },
      data: { analyzed: true },
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing dream:', error);
    return NextResponse.json(
      { error: 'Failed to analyze dream' },
      { status: 500 }
    );
  }
}
