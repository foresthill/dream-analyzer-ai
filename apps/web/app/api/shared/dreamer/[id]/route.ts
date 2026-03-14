import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/shared/dreamer/[id] - メールで共有されたドリーマーの詳細を取得
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // このドリーマーが自分に共有されているか確認
    const share = await prisma.dreamShare.findFirst({
      where: {
        dreamerId: id,
        shareType: 'EMAIL',
        sharedWithEmail: session.user.email,
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dreamer = await prisma.dreamer.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, image: true } },
        dreams: {
          orderBy: { date: 'desc' },
          include: {
            analyses: {
              orderBy: { analyzedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                psychologicalInterpretation: true,
                symbols: true,
                themes: true,
                emotionalAnalysis: true,
                underlyingMeanings: true,
                insights: true,
                provider: true,
                model: true,
                analyzedAt: true,
                conversations: {
                  orderBy: { createdAt: 'asc' },
                  select: {
                    id: true,
                    role: true,
                    content: true,
                    userName: true,
                    modelName: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dreamer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(dreamer);
  } catch (error) {
    console.error('Error fetching shared dreamer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared dreamer' },
      { status: 500 }
    );
  }
}
