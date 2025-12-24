/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    // Only disable cache and symlinks for local dev (OneDrive compatibility)
    if (process.env.NODE_ENV === 'development') {
      config.resolve.symlinks = false;
      config.cache = false;
    }
    return config;
  },
  experimental: {
    // Ensure proper client reference manifest generation
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  // Optimize Fast Refresh for better development experience
  reactStrictMode: false,
  swcMinify: true,
}

module.exports = nextConfig
