import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

// GET: ユーザーの設定を取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferredProvider: true,
        preferredModel: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      provider: user.preferredProvider,
      model: user.preferredModel,
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }
}

// PUT: ユーザーの設定を更新
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, model } = body;

    // バリデーション
    if (!provider || !model) {
      return NextResponse.json({ error: 'provider と model は必須です' }, { status: 400 });
    }

    const validProviders = ['anthropic', 'openrouter'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: '無効なプロバイダーです' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferredProvider: provider,
        preferredModel: model,
      },
      select: {
        preferredProvider: true,
        preferredModel: true,
      },
    });

    return NextResponse.json({
      provider: user.preferredProvider,
      model: user.preferredModel,
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: '設定の更新に失敗しました' }, { status: 500 });
  }
}
