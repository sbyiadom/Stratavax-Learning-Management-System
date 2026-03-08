import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle } from 'lucide-react'
import LessonContent from '@/components/dashboard/LessonContent'

// Types based on your actual schema
type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
}

type Module = {
  id: string
  title: string
  description: string | null
  module_order: number
  estimated_minutes: number | null
  course_id: string
}

type Lesson = {
  id: string
  title: string
  module_id: string
  content_type: string | null  // 'video', 'article', 'quiz', etc.
  content_url: string | null    // URL to video, article, or quiz content
  duration_minutes: number | null
  lesson_order: number
  is_published: boolean | null
  module: Module
}

type LessonProgress = {
  completed: boolean
  completed_at: string | null
  quiz_score: number | null
  time_spent: number | null
  last_position: number | null
}

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // First, verify the course exists and get its ID from the slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, description, difficulty_level, thumbnail_url')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (courseError || !course) {
    console.error('Course error:', courseError)
    notFound()
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status, progress_percentage')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  // If not enrolled, redirect to course page
  if (!enrollment) {
    redirect(`/dashboard/learn/${params.slug}`)
  }

  // Get the current lesson with its module
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      module_id,
      content_type,
      content_url,
      duration_minutes,
      lesson_order,
      is_published,
      module:modules(
        id,
        title,
        description,
        module_order,
        estimated_minutes,
        course_id
      )
    `)
    .eq('id', params.lessonId)
    .eq('is_published', true)
    .single()

  if (lessonError || !lesson) {
    console.error('Lesson error:', lessonError)
    notFound()
  }

  // Verify this lesson belongs to the correct course
  if (lesson.module.course_id !== course.id) {
    notFound()
  }

  // Get user's progress for this lesson
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed, completed_at, quiz_score, time_spent, last_position')
    .eq('user_id', user.id)
    .eq('lesson_id', params.lessonId)
    .single()

  // Get all lessons in this course for navigation
  const { data: allLessons, error: navError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      lesson_order,
      module:modules!inner(
        module_order,
        course_id
      )
    `)
    .eq('module.course_id', course.id)
    .eq('is_published', true)
    .order('module.module_order', { ascending: true })
    .order('lesson_order', { ascending: true })

  if (navError) {
    console.error('Navigation error:', navError)
  }

  // Find current index and navigation lessons
  const currentIndex = allLessons?.findIndex(l => l.id === params.lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length || 0) - 1 ? allLessons?.[currentIndex + 1] : null

  // Function to mark lesson as complete
  async function markLessonComplete() {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Update or insert progress
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: params.lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        time_spent: progress?.time_spent || 0
      }, {
        onConflict: 'user_id,lesson_id'
      })

    if (!error) {
      // Revalidate the page to show updated progress
      redirect(`/dashboard/learn/${params.slug}/${params.lessonId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/learn/${params.slug}`}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              <span>Back to Course</span>
            </Link>
            <div className="flex items-center gap-4">
              {lesson.duration_minutes && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={16} />
                  {lesson.duration_minutes} min
                </span>
              )}
              <span className="text-sm text-gray-500">
                Lesson {lesson.lesson_order}
              </span>
              {course.difficulty_level && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {course.difficulty_level}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Progress bar for course */}
          <div className="h-1 bg-gray-200">
            <div 
              className="h-1 bg-green-500 transition-all duration-300" 
              style={{ width: `${enrollment.progress_percentage || 0}%` }}
            />
          </div>

          <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>
            
            {/* Module info */}
            <div className="mb-6 text-sm text-gray-500">
              Module: {lesson.module.title}
              {lesson.module.estimated_minutes && (
                <span className="ml-2">• {lesson.module.estimated_minutes} min total</span>
              )}
            </div>
            
            <LessonContent 
              lesson={{
                ...lesson,
                content: lesson.content_url // Pass content_url as content for now
              }} 
              contentType={lesson.content_type || 'article'} 
            />

            {/* Complete button */}
            <div className="mt-8 flex justify-center">
              {progress?.completed ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle size={20} />
                  <span>Lesson Completed</span>
                </div>
              ) : (
                <form action={markLessonComplete}>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Mark as Completed
                  </button>
                </form>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              {prevLesson ? (
                <Link
                  href={`/dashboard/learn/${params.slug}/${prevLesson.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ← Previous Lesson
                </Link>
              ) : (
                <div />
              )}
              
              {nextLesson ? (
                <Link
                  href={`/dashboard/learn/${params.slug}/${nextLesson.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Next Lesson →
                </Link>
              ) : (
                <Link
                  href={`/dashboard/learn/${params.slug}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Complete Course
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Progress details */}
        {progress && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {progress.quiz_score !== null && (
              <div className="bg-white p-3 rounded-lg shadow text-center">
                <div className="text-sm text-gray-500">Quiz Score</div>
                <div className="text-xl font-bold text-blue-600">{progress.quiz_score}%</div>
              </div>
            )}
            {progress.time_spent !== null && progress.time_spent > 0 && (
              <div className="bg-white p-3 rounded-lg shadow text-center">
                <div className="text-sm text-gray-500">Time Spent</div>
                <div className="text-xl font-bold text-purple-600">{Math.floor(progress.time_spent / 60)} min</div>
              </div>
            )}
            {progress.last_position !== null && progress.last_position > 0 && (
              <div className="bg-white p-3 rounded-lg shadow text-center">
                <div className="text-sm text-gray-500">Last Position</div>
                <div className="text-xl font-bold text-orange-600">{progress.last_position}s</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
