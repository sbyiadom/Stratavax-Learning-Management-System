/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  
  // Generate a unique build ID
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // Image optimization configuration
  images: {
    domains: [
      'ffspuexbioqfwnferimq.supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
  },
  
  // REMOVED THE BAD REDIRECT THAT WAS CAUSING THE LOOP
}

module.exports = nextConfig
