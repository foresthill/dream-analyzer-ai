import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: 'Dream Analyzer - AI夢診断アプリ',
  description: '夢の内容を記録・分析し、心理学的・象徴的な解釈を提供するアプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
