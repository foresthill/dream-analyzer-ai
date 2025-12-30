import type { Metadata } from 'next';
import './globals.css';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { Providers } from '@/components/providers';

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
        <Providers>
          <div className="flex min-h-screen flex-col">
            <LayoutWrapper>{children}</LayoutWrapper>
          </div>
        </Providers>
      </body>
    </html>
  );
}
