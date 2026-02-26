import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as createServerSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_NEW
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

/**
 * Client-side Supabase client
 * Use this in client components (with 'use client' directive)
 */
export const createClient = () => {
  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!
  )
}

/**
 * Server-side Supabase client for server components and server actions
 * Use this in server components and API routes
 */
export const createServerClient = async () => {
  const cookieStore = await cookies()
  
  return createServerSupabaseClient(
    supabaseUrl!,
    supabaseAnonKey!,
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
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie error in server component
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

/**
 * Admin client with service role (server-side only)
 * Use this for admin operations that need to bypass RLS
 * NEVER use this in client components or expose to the browser
 */
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY_NEW
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createServerSupabaseClient(
    supabaseUrl!,
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
