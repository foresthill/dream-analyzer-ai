import { NextResponse } from 'next/server';
import { registerClient } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', '*');
  return res;
}

// RFC 7591 Dynamic Client Registration（ステートレス: client_id に redirect_uris を内包）
export async function POST(request: Request) {
  let body: { redirect_uris?: unknown; client_name?: unknown };
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: 'invalid_client_metadata' }, { status: 400 }));
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === 'string')
    : [];

  if (redirectUris.length === 0) {
    return withCors(
      NextResponse.json(
        { error: 'invalid_redirect_uri', error_description: 'redirect_uris is required' },
        { status: 400 }
      )
    );
  }

  const clientName = typeof body.client_name === 'string' ? body.client_name : undefined;
  const clientId = registerClient(redirectUris, clientName);
  if (!clientId) {
    return withCors(NextResponse.json({ error: 'server_error', error_description: 'secret not configured' }, { status: 500 }));
  }

  return withCors(
    NextResponse.json(
      {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        redirect_uris: redirectUris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code'],
        response_types: ['code'],
        ...(clientName ? { client_name: clientName } : {}),
      },
      { status: 201 }
    )
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
