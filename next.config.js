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
  
  // Skip build-time database calls (only during next build, NOT at runtime)
  env: {
    SKIP_BUILD_STATIC_GENERATION: process.env.NEXT_PHASE === 'phase-production-build' ? 'true' : 'false',
  },
  
  // Image optimization
  images: {
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
    minimumCacheTTL: 2592000, // 30 days for images (increased from 1 week)
    
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Disable image optimization on low-CPU VPS (images already optimized)
    unoptimized: true,
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
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
            value: 'SAMEORIGIN',
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
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self'; object-src 'self';",
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
      // User API routes - BALANCED CACHE (fresh data + server protection)
      {
        source: '/api/(editions|categories|epaper)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300', // No browser cache, 1min CDN, 5min stale cushion
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
            value: 'public, max-age=31536000, immutable', // 1 year cache - images don't change
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'X-Accel-Expires',
            value: '31536000', // Nginx cache for 1 year
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors \'self\'',
          },
        ],
      },
      // User pages - OPTIMIZED CACHE
      // Vary: User-Agent removed — it was fragmenting CDN cache per browser version,
      // effectively making CDN cache useless (every Chrome version = different cache entry).
      {
        source: '/(epaper|page)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
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

  // URL Rewrites - Homepage shows clean URL (reads from .env)
  async rewrites() {
    return [
      {
        source: '/',
        destination: process.env.NEXT_PUBLIC_HOMEPAGE || '/epaper/display',
      },
    ];
  },

  // Optimize Fast Refresh for better development experience
  reactStrictMode: false,
  swcMinify: true,
}

module.exports = withBundleAnalyzer(nextConfig)
