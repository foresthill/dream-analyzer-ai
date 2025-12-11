import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/dreamers/[id] - Get a specific dreamer
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const dreamer = await prisma.dreamer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dreams: true },
        },
      },
    });

    if (!dreamer) {
      return NextResponse.json({ error: 'Dreamer not found' }, { status: 404 });
    }

    return NextResponse.json(dreamer);
  } catch (error) {
    console.error('Error fetching dreamer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dreamer' },
      { status: 500 }
    );
  }
}

// PATCH /api/dreamers/[id] - Update a dreamer
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const dreamer = await prisma.dreamer.update({
      where: { id },
      data: {
        name: body.name,
        relationship: body.relationship,
        notes: body.notes,
      },
    });

    return NextResponse.json(dreamer);
  } catch (error) {
    console.error('Error updating dreamer:', error);
    return NextResponse.json(
      { error: 'Failed to update dreamer' },
      { status: 500 }
    );
  }
}

// DELETE /api/dreamers/[id] - Delete a dreamer
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if dreamer has dreams
    const dreamerWithCount = await prisma.dreamer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dreams: true },
        },
      },
    });

    if (!dreamerWithCount) {
      return NextResponse.json({ error: 'Dreamer not found' }, { status: 404 });
    }

    if (dreamerWithCount._count.dreams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete dreamer with existing dreams' },
        { status: 400 }
      );
    }

    await prisma.dreamer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dreamer:', error);
    return NextResponse.json(
      { error: 'Failed to delete dreamer' },
      { status: 500 }
    );
  }
}
