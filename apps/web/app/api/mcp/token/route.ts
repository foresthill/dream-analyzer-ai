import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMcpToken, isMcpConfigured } from '@/lib/mcp-auth';

export const dynamic = 'force-dynamic';

// GET /api/mcp/token - ログイン中ユーザーのMCP接続情報（URLとトークン）を返す
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isMcpConfigured()) {
    return NextResponse.json({
      configured: false,
      error: 'サーバーに AUTH_SECRET（または MCP_TOKEN_SECRET）が設定されていないため、MCPトークンを発行できません。',
    });
  }

  const origin = new URL(request.url).origin;
  const token = createMcpToken(session.user.id);

  return NextResponse.json({
    configured: true,
    url: `${origin}/api/mcp`,
    token,
  });
}
