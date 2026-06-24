import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/ai-log';
import type { Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

// GET /api/ai-logs - AI動作ログ一覧
// query: scope=mine|all (allは管理者のみ), operation, status, page
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = isAdminEmail(session.user.email);
    const { searchParams } = new URL(request.url);

    const scope = searchParams.get('scope') === 'all' && isAdmin ? 'all' : 'mine';
    const operation = searchParams.get('operation'); // ANALYZE | CHAT
    const status = searchParams.get('status');       // SUCCESS | ERROR
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const where: Prisma.AiLogWhereInput = {};
    if (scope === 'mine') {
      where.userId = session.user.id;
    }
    if (operation === 'ANALYZE' || operation === 'CHAT') {
      where.operation = operation;
    }
    if (status === 'SUCCESS' || status === 'ERROR') {
      where.status = status;
    }

    const [total, logs] = await Promise.all([
      prisma.aiLog.count({ where }),
      prisma.aiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: scope === 'all'
          ? { user: { select: { name: true, email: true } } }
          : undefined,
      }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
      isAdmin,
      scope,
    });
  } catch (error) {
    console.error('Error fetching AI logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI logs' },
      { status: 500 }
    );
  }
}
