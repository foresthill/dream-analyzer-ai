import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 軽量なミドルウェア（next-authをインポートしない）
// 認証チェックはAPIルートとページで行う
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証不要なパス（共有ページ）
  const publicPaths = ['/shared/'];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path)
  );

  // 共有ページ（トークン付き）は認証不要で通す
  // ただし /shared/with-me は認証が必要
  if (isPublicPath && !pathname.startsWith('/shared/with-me') && !pathname.startsWith('/shared/by-me')) {
    return NextResponse.next();
  }

  // 認証が必要なパス
  const protectedPaths = [
    '/dreams/new',
    '/dreams/',
    '/analysis',
    '/calendar',
    '/insights',
    '/dreamers',
    '/settings',
    '/shared',
  ];

  // セッショントークンの確認（cookieベース）
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path)
  );

  // 保護されたパスで未認証の場合、ログインページへリダイレクト
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ログインページにセッションがある場合、トップへリダイレクト
  if (pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
