/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
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
  // Ensure proper output for Vercel
  output: 'standalone',
}

module.exports = nextConfig
