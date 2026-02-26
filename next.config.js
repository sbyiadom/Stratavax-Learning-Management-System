/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ffspuexbioqfwnferimq.supabase.co'], // Add your Supabase storage domain
  },
  experimental: {
    serverActions: true,
  },
  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_SUPABASE_URL_NEW: process.env.NEXT_PUBLIC_SUPABASE_URL_NEW,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW,
  },
}

module.exports = nextConfig
