import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// GET /api/dreamers - List all dreamers
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dreamers = await prisma.dreamer.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { dreams: true },
        },
        dreams: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            title: true,
            date: true,
            mood: true,
            analyzed: true,
          },
        },
      },
    });

    return NextResponse.json(dreamers);
  } catch (error) {
    console.error('Error fetching dreamers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dreamers' },
      { status: 500 }
    );
  }
}

// POST /api/dreamers - Create a new dreamer
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const dreamer = await prisma.dreamer.create({
      data: {
        userId: session.user.id,
        name: body.name,
        relationship: body.relationship,
        notes: body.notes,
      },
    });

    return NextResponse.json(dreamer, { status: 201 });
  } catch (error) {
    console.error('Error creating dreamer:', error);
    return NextResponse.json(
      { error: 'Failed to create dreamer' },
      { status: 500 }
    );
  }
}
