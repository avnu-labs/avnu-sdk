import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'assets.coingecko.com' }, { hostname: 'opbnb.bscscan.com' }],
  },
};

export default nextConfig;
