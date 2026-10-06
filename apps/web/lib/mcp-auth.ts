import crypto from 'crypto';

/**
 * MCPサーバー用のステートレスなアクセストークン。
 * userId を AUTH_SECRET(またはMCP_TOKEN_SECRET) でHMAC署名するだけなので、
 * DB保存＝スキーマ変更＝マイグレーションが不要。
 *
 * 形式: dmcp_<base64url(userId)>.<base64url(hmac-sha256)>
 */
const PREFIX = 'dmcp_';

function getSecret(): string | null {
  return process.env.MCP_TOKEN_SECRET || process.env.AUTH_SECRET || null;
}

function sign(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('base64url');
}

export function isMcpConfigured(): boolean {
  return getSecret() !== null;
}

export function createMcpToken(userId: string): string | null {
  const key = getSecret();
  if (!key) return null;
  const payload = Buffer.from(userId, 'utf8').toString('base64url');
  return `${PREFIX}${payload}.${sign(payload, key)}`;
}

/**
 * トークン（"Bearer xxx" でも生の "dmcp_..." でも可）を検証し、userId を返す。
 * 無効なら null。
 */
export function verifyMcpToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const key = getSecret();
  if (!key) return null;

  let t = token.trim();
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7).trim();
  if (!t.startsWith(PREFIX)) return null;
  t = t.slice(PREFIX.length);

  const dot = t.indexOf('.');
  if (dot === -1) return null;
  const payload = t.slice(0, dot);
  const sig = t.slice(dot + 1);

  const expected = sign(payload, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}
