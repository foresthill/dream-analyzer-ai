import crypto from 'crypto';

/**
 * ステートレスOAuth 2.1 用のユーティリティ。
 * クライアント登録・認可コード・アクセストークンをすべて AUTH_SECRET で署名したJWT(HS256)で表現し、
 * DB保存を不要にする（＝スキーマ変更／マイグレーション不要）。
 */

function getSecret(): string | null {
  return process.env.MCP_TOKEN_SECRET || process.env.AUTH_SECRET || null;
}

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

export function signJwt(payload: Record<string, unknown>, expSec: number): string | null {
  const key = getSecret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expSec };
  const data = `${b64urlJson(header)}.${b64urlJson(body)}`;
  const sig = crypto.createHmac('sha256', key).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyJwt(token: string): Record<string, unknown> | null {
  const key = getSecret();
  if (!key) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expected = crypto.createHmac('sha256', key).update(`${h}.${p}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof body.exp === 'number' && body.exp < Math.floor(Date.now() / 1000)) return null;
  return body;
}

// ---- Dynamic Client Registration（ステートレス: client_id 自体に redirect_uris を内包） ----

export function registerClient(redirectUris: string[], clientName?: string): string | null {
  return signJwt({ t: 'client', ru: redirectUris, name: clientName ?? null }, 10 * 365 * 24 * 3600);
}

export function parseClientId(clientId: string): { redirectUris: string[] } | null {
  const body = verifyJwt(clientId);
  if (!body || body.t !== 'client' || !Array.isArray(body.ru)) return null;
  return { redirectUris: body.ru as string[] };
}

// ---- 認可コード ----

export function createAuthCode(params: {
  userId: string;
  codeChallenge: string;
  redirectUri: string;
  clientId: string;
  resource?: string;
}): string | null {
  return signJwt(
    {
      t: 'code',
      sub: params.userId,
      cc: params.codeChallenge,
      ru: params.redirectUri,
      cid: params.clientId,
      aud: params.resource ?? null,
    },
    600 // 10分
  );
}

export function parseAuthCode(code: string): {
  userId: string;
  codeChallenge: string;
  redirectUri: string;
  clientId: string;
  resource: string | null;
} | null {
  const body = verifyJwt(code);
  if (!body || body.t !== 'code') return null;
  return {
    userId: String(body.sub),
    codeChallenge: String(body.cc),
    redirectUri: String(body.ru),
    clientId: String(body.cid),
    resource: (body.aud as string | null) ?? null,
  };
}

// ---- アクセストークン ----

export function createAccessToken(userId: string, resource: string | null): string | null {
  return signJwt({ t: 'access', sub: userId, aud: resource }, 30 * 24 * 3600); // 30日
}

/** Authorization ヘッダ（"Bearer xxx"）または生トークンから userId を取り出す。OAuthアクセストークン専用。 */
export function userIdFromAccessToken(header: string | null | undefined): string | null {
  if (!header) return null;
  let t = header.trim();
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7).trim();
  const body = verifyJwt(t);
  if (!body || body.t !== 'access') return null;
  return String(body.sub);
}

// ---- PKCE (S256) ----

export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const a = Buffer.from(hash);
  const b = Buffer.from(codeChallenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
