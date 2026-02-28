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
  // Remove this line: output: 'standalone',
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
