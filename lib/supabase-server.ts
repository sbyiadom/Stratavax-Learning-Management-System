// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Export a function to create a client (for server components that need async)
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

// For backward compatibility - create a singleton that can be used directly
// This is what most files expect (supabaseServer.from(...))
export const supabaseServer = createServerClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      getAll() {
        // This needs to be handled differently for server-side
        // Return empty array for now - this will be populated on the client
        return []
      },
      setAll(cookiesToSet: any) {
        // No-op for server-side
      },
    },
  }
)
