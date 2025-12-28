/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Build configuration for Hostinger VPS
  output: 'standalone',
  
  // Skip build-time database calls
  env: {
    SKIP_BUILD_STATIC_GENERATION: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache settings - EXTREME optimization for 1000+ users
    minimumCacheTTL: 604800, // 1 week for images
    
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      '@heroicons/react', 
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias.canvas = false;
    
    // Fix lucide-react module resolution
    config.resolve.alias['lucide-react'] = require.resolve('lucide-react');
    
    // Only disable cache and symlinks for local dev (OneDrive compatibility)
    if (process.env.NODE_ENV === 'development') {
      config.resolve.symlinks = false;
      config.cache = false;
    }

    return config;
  },

  // EXTREME PERFORMANCE for 1000+ concurrent users on Hostinger VPS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Allow iframe from same origin
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Admin routes - NO CACHING
      {
        source: '/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Admin API routes - NO CACHING
      {
        source: '/api/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // User API routes - AGGRESSIVE CACHE for 1000+ users
      {
        source: '/api/(editions|categories|epaper)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600', // 5min browser, 30min CDN, 1hr stale
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Static assets - MAXIMUM CACHE
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // PDF and media files - EXTREME CACHE for millisecond loading
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=7776000', // 1week browser, 1month CDN, 3month stale
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'X-Accel-Expires',
            value: '2592000', // Nginx cache for 1 month
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Allow iframe from same origin
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors \'self\'', // Allow embedding in same origin
          },
        ],
      },
      // User pages - OPTIMIZED CACHE
      {
        source: '/(epaper|page)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, s-maxage=1800, stale-while-revalidate=3600', // 10min browser, 30min CDN, 1hr stale
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, User-Agent',
          },
        ],
      },
      // CSS, JS, fonts - MAXIMUM CACHE
      {
        source: '/:path*\\.(css|js|woff|woff2|ttf|eot|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Images - LONG CACHE
      {
        source: '/:path*\\.(png|jpg|jpeg|gif|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=7776000',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
    ];
  },

  // Optimize Fast Refresh for better development experience
  reactStrictMode: false,
  swcMinify: true,
}

module.exports = withBundleAnalyzer(nextConfig)
