// lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create and export a default client instance
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Export a createClient function for compatibility with existing imports
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
