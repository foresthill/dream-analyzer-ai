import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', '*');
  return res;
}

// RFC 9728 Protected Resource Metadata。MCPサーバー(リソース)がどの認可サーバーを使うかを示す。
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return withCors(
    NextResponse.json({
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: ['dreams.read'],
      bearer_methods_supported: ['header'],
    })
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
