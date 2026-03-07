import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW!

// Server-side Supabase client (for server components)
export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {
          // Server components cannot set cookies
          // This is handled in middleware and route handlers
        },
        remove() {
          // Server components cannot remove cookies
          // This is handled in middleware and route handlers
        },
      },
    }
  )
}

// Admin client with service role (for admin operations, bypasses RLS)
export const createAdminClient = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      cookies: {
        get() { return '' },
        set() {},
        remove() {},
      },
    }
  )
}

// For backwards compatibility
export const createServerClient = createClient

export type { Database }
