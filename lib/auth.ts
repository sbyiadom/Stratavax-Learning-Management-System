import { createClient } from './supabase'
import type { User } from '@supabase/supabase-js'

// Auth configuration for Supabase
export const authConfig = {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
}

// Helper functions for auth
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const requireAuth = async () => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export const signOut = async () => {
  const supabase = createClient()
  await supabase.auth.signOut()
}

// Role-based access control
export const hasRole = (user: User | null, role: string): boolean => {
  // You can implement role checking based on user metadata or a profiles table
  const userRole = user?.user_metadata?.role || 'user'
  return userRole === role
}

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin')
}

export const isInstructor = (user: User | null): boolean => {
  return hasRole(user, 'instructor') || hasRole(user, 'admin')
}
