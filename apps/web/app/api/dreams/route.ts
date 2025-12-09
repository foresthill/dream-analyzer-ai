import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/dreams - List all dreams
export async function GET() {
  try {
    const dreams = await prisma.dream.findMany({
      orderBy: { date: 'desc' },
      include: { analysis: true },
    });

    return NextResponse.json(dreams);
  } catch (error) {
    console.error('Error fetching dreams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dreams' },
      { status: 500 }
    );
  }
}

// POST /api/dreams - Create a new dream
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        email: 'default@example.com',
        name: 'Default User',
      },
    });

    const dream = await prisma.dream.create({
      data: {
        userId: 'default-user', // TODO: Get from auth
        title: body.title,
        content: body.content,
        date: new Date(body.date),
        mood: body.mood.toUpperCase(),
        lucidity: body.lucidity ?? 5,
        vividness: body.vividness ?? 5,
        emotionalIntensity: body.emotionalIntensity ?? 5,
        setting: body.setting,
        characters: body.characters ?? [],
        emotions: body.emotions ?? [],
        colors: body.colors ?? [],
        sleepQuality: body.sleepQuality,
        bedTime: body.bedTime ? new Date(body.bedTime) : null,
        wakeTime: body.wakeTime ? new Date(body.wakeTime) : null,
        tags: body.tags ?? [],
        analyzed: false,
      },
    });

    // Automatically trigger analysis
    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const analyzeResponse = await fetch(
      `${baseUrl}/api/analyze`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamId: dream.id,
          provider: body.provider,
          model: body.model,
        }),
      }
    );

    if (analyzeResponse.ok) {
      const updatedDream = await prisma.dream.findUnique({
        where: { id: dream.id },
        include: { analysis: true },
      });
      return NextResponse.json(updatedDream, { status: 201 });
    }

    return NextResponse.json(dream, { status: 201 });
  } catch (error) {
    console.error('Error creating dream:', error);
    return NextResponse.json(
      { error: 'Failed to create dream' },
      { status: 500 }
    );
  }
}
