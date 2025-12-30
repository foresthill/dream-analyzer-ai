import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// GET /api/dreams - List all dreams
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dreamerId = searchParams.get('dreamerId');

    const dreams = await prisma.dream.findMany({
      where: {
        userId: session.user.id,
        ...(dreamerId && { dreamerId }),
      },
      orderBy: { date: 'desc' },
      include: {
        analyses: true,
        dreamer: true,
      },
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const dream = await prisma.dream.create({
      data: {
        userId: session.user.id,
        dreamerId: body.dreamerId,
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

    // Return the created dream (analysis will be triggered manually by user)
    return NextResponse.json(dream, { status: 201 });
  } catch (error) {
    console.error('Error creating dream:', error);
    return NextResponse.json(
      { error: 'Failed to create dream' },
      { status: 500 }
    );
  }
}
