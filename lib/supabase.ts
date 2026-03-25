// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a browser client for client-side usage
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Export a default client instance (singleton)
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabase = () => {
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}
