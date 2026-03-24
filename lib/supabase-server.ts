// lib/supabase-server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use service role key for server-side operations (admin privileges)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server-side client. Please set NEXT_PUBLIC_SUPABASE_URL_NEW and SUPABASE_SERVICE_ROLE_KEY_NEW')
}

// Create a server-side Supabase client with admin privileges
export const supabaseServer = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Export a createClient function for compatibility with existing imports
export const createClient = async () => {
  return supabaseServer
}
