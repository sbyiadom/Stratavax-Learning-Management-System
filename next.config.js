/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  // This helps with client manifest generation
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
