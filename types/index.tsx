export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  role?: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  instructor_id?: string
  duration: string | null
  level: string | null
  price: number
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  instructor_details?: Profile
  modules?: Module[]
  enrollments?: Enrollment[]
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  course_id: string
  module_id: string | null
  title: string
  content: string | null
  video_url: string | null
  duration: string | null
  order_index: number
  created_at: string
  updated_at: string
  module?: Module
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  module_id: string | null
  course_id: string
  is_completed: boolean
  completed_at: string | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  progress_percentage: number
  status: 'in_progress' | 'completed' | 'dropped'
  updated_at: string
  course?: Course
  user?: Profile
}

export interface Assessment {
  id: string
  lesson_id: string
  title: string
  description: string | null
  questions: any[]
  passing_score: number
  time_limit: number | null
  attempts_allowed: number
  created_at: string
  updated_at: string
}

export interface AssessmentAttempt {
  id: string
  user_id: string
  assessment_id: string
  course_id: string
  answers: any[]
  score: number
  passed: boolean
  completed_at: string
  created_at: string
}

export interface MicrosoftFormIntegration {
  id: string
  form_id: string
  user_id: string
  form_name: string
  access_token: string
  refresh_token: string
  expires_at: string
  settings: any
  created_at: string
  updated_at: string
}

export interface GitHubSync {
  id: string
  user_id: string
  owner: string
  repo: string
  synced_at: string
  created_at: string
}
