import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { randomBytes } from 'crypto';

// GET /api/shares - 自分が作成した共有一覧
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shares = await prisma.dreamShare.findMany({
      where: { ownerId: session.user.id },
      include: {
        dream: { select: { id: true, title: true, date: true } },
        dreamer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 }
    );
  }
}

// POST /api/shares - 新しい共有を作成
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shareType, dreamId, dreamerId, sharedWithEmail } = body;

    // バリデーション
    if (!shareType || !['EMAIL', 'LINK'].includes(shareType)) {
      return NextResponse.json(
        { error: 'shareType は EMAIL または LINK を指定してください' },
        { status: 400 }
      );
    }

    if (!dreamId && !dreamerId) {
      return NextResponse.json(
        { error: 'dreamId または dreamerId を指定してください' },
        { status: 400 }
      );
    }

    if (dreamId && dreamerId) {
      return NextResponse.json(
        { error: 'dreamId と dreamerId は同時に指定できません' },
        { status: 400 }
      );
    }

    if (shareType === 'EMAIL' && !sharedWithEmail) {
      return NextResponse.json(
        { error: 'メールアドレスを指定してください' },
        { status: 400 }
      );
    }

    // 対象の所有権を確認
    if (dreamId) {
      const dream = await prisma.dream.findUnique({ where: { id: dreamId } });
      if (!dream || dream.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    if (dreamerId) {
      const dreamer = await prisma.dreamer.findUnique({ where: { id: dreamerId } });
      if (!dreamer || dreamer.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    // 重複チェック
    const existingShare = await prisma.dreamShare.findFirst({
      where: {
        ownerId: session.user.id,
        shareType,
        ...(dreamId && { dreamId }),
        ...(dreamerId && { dreamerId }),
        ...(shareType === 'EMAIL' && { sharedWithEmail }),
      },
    });

    if (existingShare) {
      // 既存の共有を返す
      return NextResponse.json(existingShare);
    }

    // 共有を作成
    const shareToken = shareType === 'LINK'
      ? randomBytes(32).toString('base64url')
      : null;

    const share = await prisma.dreamShare.create({
      data: {
        ownerId: session.user.id,
        shareType,
        dreamId: dreamId || null,
        dreamerId: dreamerId || null,
        sharedWithEmail: shareType === 'EMAIL' ? sharedWithEmail : null,
        shareToken,
      },
      include: {
        dream: { select: { id: true, title: true, date: true } },
        dreamer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
