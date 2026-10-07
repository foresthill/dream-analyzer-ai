import { NextResponse } from 'next/server';
import { parseAuthCode, verifyPkceS256, createAccessToken } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', '*');
  return res;
}

function err(code: string, status = 400, description?: string): NextResponse {
  return withCors(
    NextResponse.json({ error: code, ...(description ? { error_description: description } : {}) }, { status })
  );
}

// OAuth 2.1 Token Endpoint（authorization_code + PKCE のみ）
export async function POST(request: Request) {
  // トークンエンドポイントは form-urlencoded が標準。JSONも一応受ける。
  let params: Record<string, string> = {};
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const j = await request.json();
      params = Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v)]));
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) params[k] = String(v);
    }
  } catch {
    return err('invalid_request', 400, 'リクエストボディを解析できません');
  }

  if (params.grant_type !== 'authorization_code') {
    return err('unsupported_grant_type');
  }

  const code = params.code;
  const redirectUri = params.redirect_uri;
  const codeVerifier = params.code_verifier;
  const clientId = params.client_id;

  if (!code || !codeVerifier) {
    return err('invalid_request', 400, 'code と code_verifier は必須です');
  }

  const parsed = parseAuthCode(code);
  if (!parsed) return err('invalid_grant', 400, 'コードが無効か期限切れです');

  if (redirectUri && redirectUri !== parsed.redirectUri) {
    return err('invalid_grant', 400, 'redirect_uri が一致しません');
  }
  if (clientId && clientId !== parsed.clientId) {
    return err('invalid_grant', 400, 'client_id が一致しません');
  }
  if (!verifyPkceS256(codeVerifier, parsed.codeChallenge)) {
    return err('invalid_grant', 400, 'PKCE 検証に失敗しました');
  }

  const accessToken = createAccessToken(parsed.userId, parsed.resource);
  if (!accessToken) return err('server_error', 500);

  return withCors(
    NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 3600,
      scope: 'dreams.read',
    })
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
