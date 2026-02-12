import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Flexible environment variable detection
const supabaseUrl = (() => {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL_NEW) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL_NEW
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  }
  return process.env.SUPABASE_URL || ''
})()

const supabaseAnonKey = (() => {
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
  return process.env.SUPABASE_ANON_KEY || ''
})()

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL_NEW or NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create and export the Supabase client
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Singleton instance for convenience
const supabase = createClient()
export default supabase

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
  instructor?: any
  modules?: Module[]
}

export type Module = {
  id: string
  course_id: string
  title: string
  description: string
  order: number
  lessons?: Lesson[]
  created_at: string
}

export type Lesson = {
  id: string
  module_id: string
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
  module_id: string
  lesson_id: string
  is_completed: boolean
  progress_percentage?: number
  last_accessed_at: string
  completed_at?: string
  created_at: string
}

export type Enrollment = {
  id: string
  user_id: string
  course_id: string
  progress_percentage: number
  status: 'not_started' | 'in_progress' | 'completed'
  enrolled_at: string
  completed_at?: string
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
