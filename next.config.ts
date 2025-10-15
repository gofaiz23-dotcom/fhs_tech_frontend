import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable development indicators
  devIndicators: false,
  
  // Optimize development experience
  experimental: {
    // Disable experimental features for stability
  },
  
  // Webpack configuration for better development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce file watching overhead
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
        ],
      };
    }
    return config;
  },
  
  // Reduce build output
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
