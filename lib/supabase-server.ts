import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW!

// Server-side Supabase client (for server components and server actions)
export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
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
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookie handling
        },
      },
    }
  )
}

// For API routes and server components that need the server client
export const createServerSupabase = async () => {
  return await createClient()
}

export type { Database }
