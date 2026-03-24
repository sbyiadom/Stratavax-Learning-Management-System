// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

// Singleton instance - only one client is created
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export const getSupabase = () => {
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

// For backward compatibility
export const supabase = getSupabase()
export const createClient = getSupabase
