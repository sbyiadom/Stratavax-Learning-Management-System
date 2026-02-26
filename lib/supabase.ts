import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as createServerSupabaseClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

// Client-side Supabase client
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
  )
}

// Server-side Supabase client for server components and server actions
export const createServerClient = async () => {
  const cookieStore = await cookies()
  
  return createServerSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie error in server component
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie error in server component
          }
        },
      },
    }
  )
}

// Admin client with service role (server-side only)
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW || 
                         process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createServerSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Default client for client components
const supabase = createClient()
export default supabase

// Export types
export type { Database }
