import { createClient } from '@supabase/supabase-js'

// Flexible environment variable detection
// This will work with ANY naming convention in ANY project
const supabaseUrl = (() => {
  // Try new variables first (for second project)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL_NEW) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL_NEW
  }
  // Fall back to standard variables (for first project)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  }
  // Last resort fallback
  return process.env.SUPABASE_URL || ''
})()

const supabaseAnonKey = (() => {
  // Try new variables first (for second project)
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW
  }
  // Fall back to standard variables (for first project)
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
  // Last resort fallback
  return process.env.SUPABASE_ANON_KEY || ''
})()

// Validate that we have the required values
if (!supabaseUrl) {
  throw new Error(
    'Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL_NEW or NEXT_PUBLIC_SUPABASE_URL'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing Supabase Anon Key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Course = {
  id: string
  title: string
  description: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  image_url: string
  created_at: string
}

export type Lesson = {
  id: string
  course_id: string
  title: string
  content: string
  order: number
  duration: number
  video_url?: string
  created_at: string
}

export type UserProgress = {
  id: string
  user_id: string
  course_id: string
  lesson_id: string
  completed: boolean
  progress: number
  last_accessed: string
}

export type Assessment = {
  id: string
  lesson_id: string
  user_id: string
  form_id: string
  score: number
  submitted_at: string
  responses: Record<string, any>
}
