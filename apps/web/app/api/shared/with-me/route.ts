import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// GET /api/shared/with-me - 自分に共有されたコンテンツ一覧
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shares = await prisma.dreamShare.findMany({
      where: {
        shareType: 'EMAIL',
        sharedWithEmail: session.user.email,
      },
      include: {
        owner: { select: { name: true, image: true } },
        dream: {
          include: {
            dreamer: { select: { name: true } },
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
              },
            },
          },
        },
        dreamer: {
          include: {
            dreams: {
              orderBy: { date: 'desc' },
              take: 5,
              select: {
                id: true,
                title: true,
                date: true,
                mood: true,
                analyzed: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error fetching shared content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared content' },
      { status: 500 }
    );
  }
}
