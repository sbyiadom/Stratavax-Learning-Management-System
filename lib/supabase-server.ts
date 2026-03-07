import { createServerClient as createServerSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

// Server-side Supabase client (for server components)
export const createServerClient = async () => {
  const cookieStore = await cookies()
  
  return createServerSupabaseClient(
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

// Admin client with service role (server-side only)
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW!
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createServerSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
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

export type { Database }
