import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
