import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/shared/dream/[id] - メールで共有された夢の詳細を取得
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // この夢が自分に共有されているか確認
    const share = await prisma.dreamShare.findFirst({
      where: {
        dreamId: id,
        shareType: 'EMAIL',
        sharedWithEmail: session.user.email,
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dream = await prisma.dream.findUnique({
      where: { id },
      include: {
        dreamer: { select: { name: true } },
        analyses: {
          orderBy: { analyzedAt: 'desc' },
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
          },
        },
        user: { select: { name: true, image: true } },
      },
    });

    if (!dream) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(dream);
  } catch (error) {
    console.error('Error fetching shared dream:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared dream' },
      { status: 500 }
    );
  }
}
