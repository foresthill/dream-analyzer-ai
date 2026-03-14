import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/shared/[token] - 共有リンクからデータを取得（認証不要）
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const share = await prisma.dreamShare.findUnique({
      where: { shareToken: token },
      include: {
        owner: { select: { name: true, image: true } },
        dream: {
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
        dreamer: {
          include: {
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
        },
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // レスポンスから不要な情報を除外
    return NextResponse.json({
      id: share.id,
      shareType: share.shareType,
      ownerName: share.owner.name,
      ownerImage: share.owner.image,
      dream: share.dream,
      dreamer: share.dreamer,
      createdAt: share.createdAt,
    });
  } catch (error) {
    console.error('Error fetching shared content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared content' },
      { status: 500 }
    );
  }
}
