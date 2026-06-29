import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/dreams/[id] - Get a single dream
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const dream = await prisma.dream.findFirst({
      where: { id, userId: session.user.id },
      include: {
        analyses: true,
        dreamer: true,
      },
    });

    if (!dream) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    return NextResponse.json(dream);
  } catch (error) {
    console.error('Error fetching dream:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dream' },
      { status: 500 }
    );
  }
}

// PUT /api/dreams/[id] - Update a dream
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.dream.findFirst({
      where: { id, userId: session.user.id },
      include: { analyses: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dream not found' }, { status: 404 });
    }

    const body = await request.json();

    // 指定されたドリーマーが本人のものか検証（他人のdreamerIdへの紐付けを防ぐ）
    if (!body.dreamerId) {
      return NextResponse.json(
        { error: 'dreamerId is required' },
        { status: 400 }
      );
    }
    const dreamer = await prisma.dreamer.findFirst({
      where: { id: body.dreamerId, userId: session.user.id },
      select: { id: true },
    });
    if (!dreamer) {
      return NextResponse.json(
        { error: 'Dreamer not found' },
        { status: 404 }
      );
    }

    // Check if content changed significantly (triggers re-analysis)
    const contentChanged = existing.content !== body.content ||
      existing.title !== body.title;

    // Update the dream
    const dream = await prisma.dream.update({
      where: { id },
      data: {
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
        // If content changed, reset analyzed flag so user is prompted to re-analyze
        ...(contentChanged && existing.analyses.length > 0
          ? { analyzed: false }
          : {}),
      },
      include: {
        analyses: true,
      },
    });

    // If content changed, delete existing analyses (they're based on old content)
    if (contentChanged && existing.analyses.length > 0) {
      await prisma.dreamAnalysis.deleteMany({
        where: { dreamId: id },
      });
    }

    return NextResponse.json({
      ...dream,
      analyses: contentChanged ? [] : dream.analyses,
      contentChanged,
    });
  } catch (error) {
    console.error('Error updating dream:', error);
    return NextResponse.json(
      { error: 'Failed to update dream' },
      { status: 500 }
    );
  }
}
