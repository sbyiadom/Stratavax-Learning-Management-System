import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import LessonContent from '@/components/dashboard/LessonContent'

// Types based on your actual schema
type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced' | null
}

type Module = {
  id: string
  title: string
  description: string | null
  module_order: number
  course_id: string
}

type Lesson = {
  id: string
  title: string
  description: string | null
  content_type: string | null
  content: any
  lesson_order: number
  module_id: string
  module: Module & {
    course: Course
  }
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
    .select('id, title, slug, description, difficulty_level')
    .eq('slug', params.slug)
    .single()

  if (courseError || !course) {
    console.error('Course error:', courseError)
    notFound()
  }

  // Get the current lesson with its module
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      description,
      content_type,
      content,
      lesson_order,
      module_id,
      module:modules(
        id,
        title,
        description,
        module_order,
        course_id
      )
    `)
    .eq('id', params.lessonId)
    .single()

  if (lessonError || !lesson) {
    console.error('Lesson error:', lessonError)
    notFound()
  }

  // Verify this lesson belongs to the correct course
  if (lesson.module.course_id !== course.id) {
    notFound()
  }

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
    .order('module.module_order', { ascending: true })
    .order('lesson_order', { ascending: true })

  if (navError) {
    console.error('Navigation error:', navError)
  }

  // Check if user has progress for this lesson
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', params.lessonId)
    .single()

  // If no progress exists, create one
  if (!progress) {
    await supabase
      .from('lesson_progress')
      .insert({
        user_id: user.id,
        lesson_id: params.lessonId,
        completed: false,
        progress_percent: 0
      })
  }

  // Find current index and navigation lessons
  const currentIndex = allLessons?.findIndex(l => l.id === params.lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length || 0) - 1 ? allLessons?.[currentIndex + 1] : null

  // Add course and module info to lesson for display
  const lessonWithDetails = {
    ...lesson,
    module: {
      ...lesson.module,
      course: course
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
              <span className="text-sm text-gray-500">
                Lesson {lesson.lesson_order} • {lesson.content_type || 'video'}
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
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>
          
          {lesson.description && (
            <p className="text-gray-600 mb-6">{lesson.description}</p>
          )}
          
          <LessonContent 
            lesson={lesson} 
            contentType={lesson.content_type || 'article'} 
          />

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

        {/* Progress indicator */}
        {progress && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span>Your progress</span>
              <span>{progress.progress_percent || 0}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${progress.progress_percent || 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
