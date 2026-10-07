import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@dream-analyzer/shared-types',
    '@dream-analyzer/dream-core',
    '@dream-analyzer/ui-components',
  ],
  // OAuthディスカバリ用の .well-known を実ルートへマップ（ドット始まりフォルダのルーティング差異を回避）
  async rewrites() {
    return [
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/well-known/oauth-protected-resource',
      },
      {
        source: '/.well-known/oauth-protected-resource/:path*',
        destination: '/api/well-known/oauth-protected-resource',
      },
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/well-known/oauth-authorization-server',
      },
      {
        source: '/.well-known/oauth-authorization-server/:path*',
        destination: '/api/well-known/oauth-authorization-server',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
