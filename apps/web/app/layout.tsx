import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: '夢分析AI - Dream Analyzer',
  description: '夢の内容を記録・分析し、心理学的・象徴的な解釈を提供するアプリケーション',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '夢分析AI',
  },
};

export const viewport: Viewport = {
  themeColor: '#312e81',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
