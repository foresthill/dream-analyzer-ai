import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@dream-analyzer/shared-types',
    '@dream-analyzer/dream-core',
    '@dream-analyzer/ui-components',
  ],
};

export default nextConfig;
