import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', '*');
  return res;
}

// RFC 8414 Authorization Server Metadata。
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return withCors(
    NextResponse.json({
      issuer: origin,
      authorization_endpoint: `${origin}/api/oauth/authorize`,
      token_endpoint: `${origin}/api/oauth/token`,
      registration_endpoint: `${origin}/api/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['dreams.read'],
    })
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
