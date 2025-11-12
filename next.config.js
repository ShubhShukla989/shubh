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
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // Fix OneDrive symlink issues on Windows
    config.resolve.symlinks = false;
    // Disable webpack cache for OneDrive compatibility
    config.cache = false;
    return config;
  },
}

module.exports = nextConfig
