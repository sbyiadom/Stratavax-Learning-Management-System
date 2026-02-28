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
  output: 'standalone',
  // Disable static generation for problematic routes
  staticPageGenerationTimeout: 120,
  // Add this to skip the manifest check
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
