// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a server-side Supabase client
export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
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
            // Handle errors silently
          }
        },
      },
    }
  )
}

// Create a singleton instance for admin operations (using service role)
let adminInstance: ReturnType<typeof createServerClient<Database>> | null = null

export const supabaseServer = createServerClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
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

// For convenience, export a singleton for regular operations
let serverInstance: Awaited<ReturnType<typeof createClient>> | null = null

export const getSupabase = async () => {
  if (!serverInstance) {
    serverInstance = await createClient()
  }
  return serverInstance
}
