// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a server-side Supabase client WITHOUT strict types
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
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
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

// Export a simple client for admin operations
export const supabaseServer = createServerClient(
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
