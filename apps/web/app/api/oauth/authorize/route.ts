import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseClientId, createAuthCode } from '@/lib/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function htmlPage(title: string, bodyHtml: string, status = 200): NextResponse {
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,"Hiragino Kaku Gothic ProN",sans-serif;background:#f8f7ff;color:#1f2937;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;max-width:420px;width:100%;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
  h1{font-size:20px;margin:0 0 6px}
  p{color:#4b5563;font-size:14px;line-height:1.7}
  .row{display:flex;gap:10px;margin-top:20px}
  a.btn{flex:1;text-align:center;padding:12px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px}
  .allow{background:#4f46e5;color:#fff}
  .deny{background:#f3f4f6;color:#374151}
  .scope{background:#f9fafb;border:1px solid #eef2ff;border-radius:10px;padding:12px;margin-top:14px;font-size:13px;color:#374151}
</style></head><body><div class="card">${bodyHtml}</div></body></html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = url.searchParams;
  const responseType = p.get('response_type');
  const clientId = p.get('client_id') || '';
  const redirectUri = p.get('redirect_uri') || '';
  const codeChallenge = p.get('code_challenge') || '';
  const codeChallengeMethod = p.get('code_challenge_method') || '';
  const state = p.get('state') || '';
  const resource = p.get('resource') || undefined;
  const approved = p.get('approved');

  // --- パラメータ検証（リダイレクトせずエラー表示すべきケース） ---
  const client = clientId ? parseClientId(clientId) : null;
  if (!client) {
    return htmlPage('エラー', '<h1>接続エラー</h1><p>client_id が無効です。もう一度コネクターの追加からやり直してください。</p>', 400);
  }
  if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
    return htmlPage('エラー', '<h1>接続エラー</h1><p>redirect_uri が登録内容と一致しません。</p>', 400);
  }

  // ここから先のエラーは redirect_uri へ返す
  const back = (params: Record<string, string>) => {
    const u = new URL(redirectUri);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    if (state) u.searchParams.set('state', state);
    return NextResponse.redirect(u.toString(), 302);
  };

  if (responseType !== 'code') return back({ error: 'unsupported_response_type' });
  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return back({ error: 'invalid_request', error_description: 'PKCE(S256)が必要です' });
  }

  // --- ログイン確認（未ログインならログインへ、戻り先はこのURL） ---
  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl.toString(), 302);
  }

  // --- 同意 ---
  if (approved !== '1') {
    const approveUrl = new URL(request.url);
    approveUrl.searchParams.set('approved', '1');
    const denyUrl = new URL(redirectUri);
    denyUrl.searchParams.set('error', 'access_denied');
    if (state) denyUrl.searchParams.set('state', state);
    const appName = client.redirectUris[0] || 'アプリ';
    return htmlPage(
      '接続の許可',
      `<h1>夢データへのアクセスを許可しますか？</h1>
       <p>外部アプリ（AIクライアント）が、あなたの夢データに接続しようとしています。</p>
       <div class="scope">🔒 許可される操作: <b>夢・分析の読み取り</b>（書き込みはできません）<br/>アカウント: ${session.user.email ?? session.user.name ?? ''}</div>
       <p style="font-size:12px;color:#6b7280;margin-top:10px">リダイレクト先: ${appName}</p>
       <div class="row">
         <a class="btn deny" href="${denyUrl.toString()}">拒否</a>
         <a class="btn allow" href="${approveUrl.toString()}">許可する</a>
       </div>`
    );
  }

  // --- 認可コード発行 ---
  const code = createAuthCode({
    userId: session.user.id,
    codeChallenge,
    redirectUri,
    clientId,
    resource,
  });
  if (!code) return back({ error: 'server_error' });
  return back({ code });
}
