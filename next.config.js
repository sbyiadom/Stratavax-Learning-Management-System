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
  // Enable standalone output for better Vercel compatibility
  output: 'standalone',
  // Force dynamic rendering for all routes
  staticPageGenerationTimeout: 120,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
