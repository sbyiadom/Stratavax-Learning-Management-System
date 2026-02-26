'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client (for client components only)
export const createClient = () => {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}

// Default client
const supabase = createClient()
export default supabase

// Export types
export type { Database }
