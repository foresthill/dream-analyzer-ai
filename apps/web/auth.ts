import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      // AUTH_GOOGLE_ID/SECRET（v5推奨）または GOOGLE_CLIENT_ID/SECRET（従来）
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  // JWT セッション方式。ログイン判定を Cookie 内の JWT だけで行い、毎回の DB 問い合わせを無くす。
  // これにより Neon(サーバーレスDB) のコールドスタートでログイン状態が崩れる問題を防ぐ。
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  callbacks: {
    // サインイン時だけ user が渡ってくる。ユーザーIDをトークンに載せ、以降はトークンを使い回す。
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // セッションにはトークンから userId を復元（DB を見ない）。
    session({ session, token }) {
      // token.id は jwt コールバックで載せた userId。無ければ既定の sub を使う。
      const userId = (token.id as string | undefined) ?? token.sub;
      if (session.user && userId) {
        session.user.id = userId;
      }
      return session;
    },
  },
  trustHost: true,
});
