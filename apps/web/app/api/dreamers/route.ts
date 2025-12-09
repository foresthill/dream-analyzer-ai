import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/dreamers - List all dreamers
export async function GET() {
  try {
    const dreamers = await prisma.dreamer.findMany({
      where: { userId: 'default-user' }, // TODO: Get from auth
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { dreams: true },
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

    const dreamer = await prisma.dreamer.create({
      data: {
        userId: 'default-user', // TODO: Get from auth
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
