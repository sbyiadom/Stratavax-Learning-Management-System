/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  // This is the key fix - disable static generation for problematic routes
  output: 'standalone',
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
