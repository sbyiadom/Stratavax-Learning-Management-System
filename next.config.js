/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  
  // Experimental features
  experimental: {
    // Allow specific packages to be used with server components
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  
  // Remove standalone output as it's not needed for Vercel
  // Vercel handles this automatically
  
  // Generate a unique build ID
  generateBuildId: async () => {
    // You can, for example, get the latest git commit hash here
    return 'build-' + Date.now()
  },
  
  // Image optimization configuration
  images: {
    domains: [
      'ffspuexbioqfwnferimq.supabase.co', // Your Supabase storage domain
      'avatars.githubusercontent.com',      // GitHub avatars
      'lh3.googleusercontent.com',         // Google avatars
    ],
  },
  
  // Redirects (if needed)
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
