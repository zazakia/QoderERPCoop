/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for static hosting (disabled for dev)
  // output: 'export',
  // trailingSlash: true,
  // distDir: 'out',
  
  // Image optimization
  images: {
    // Enable image optimization for production
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  
  // Experimental features for performance
  experimental: {
    swcPlugins: [],
    // Enable server actions for better performance
    serverActions: true,
  },
  
  // Force Next.js to use SWC for compilation even with custom Babel config
  swcMinify: true,
  
  // Bundle analyzer for production builds
  bundleAnalyzer: process.env.ANALYZE === 'true' ? {
    enabled: true,
  } : undefined,
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      
      // Production optimizations
      if (!dev) {
        // Split chunks for better caching
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        };
      }
    }
    
    return config;
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO and UX
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;