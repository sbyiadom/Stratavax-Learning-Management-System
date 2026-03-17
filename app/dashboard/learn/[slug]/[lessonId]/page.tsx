// Add dynamic export to fix DYNAMIC_SERVER_USAGE warning
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle } from 'lucide-react'
import LessonContent from '@/components/dashboard/LessonContent'
import LubricationModule from '@/components/courses/lubrication-module'

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
  content_type: string | null
  content_url: string | null
  duration_minutes: number | null
  lesson_order: number
  is_published: boolean | null
}

type LessonProgress = {
  completed: boolean
  completed_at: string | null
  quiz_score: number | null
  time_spent: number | null
  last_position: number | null
}

type Enrollment = {
  status: string
  progress_percentage: number
}

// Server action defined at the top level, outside the component
async function markLessonComplete(formData: FormData) {
  'use server'
  
  const courseId = formData.get('courseId') as string
  const lessonId = formData.get('lessonId') as string
  const slug = formData.get('slug') as string
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const { data: currentProgress } = await supabase
    .from('lesson_progress')
    .select('time_spent')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle() as any

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      time_spent: currentProgress?.time_spent || 0
    } as any, {
      onConflict: 'user_id,lesson_id'
    } as any)

  if (!error) {
    await updateCourseProgress(user.id, courseId)
    redirect(`/dashboard/learn/${slug}/${lessonId}`)
  }
}

// Helper function for updating course progress
async function updateCourseProgress(userId: string, courseId: string) {
  const supabase = await createClient()
  
  const { data: courseModules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId) as any

  if (!courseModules || courseModules.length === 0) return

  const moduleIds = courseModules.map((m: any) => m.id)
  
  const { data: totalLessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds)
    .eq('is_published', true) as any

  if (!totalLessons || totalLessons.length === 0) return

  const { data: completedLessons } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', totalLessons.map((l: any) => l.id)) as any

  const progressPercentage = Math.round((completedLessons?.length || 0) / totalLessons.length * 100)
  
  await supabase
    .from('enrollments')
    .update({ 
      progress_percentage: progressPercentage,
      ...(progressPercentage === 100 ? { completed_at: new Date().toISOString() } : {})
    } as any)
    .eq('user_id', userId)
    .eq('course_id', courseId)
}

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string }
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
    }

    console.log('Loading lesson page for:', params)

    // First, verify the course exists and get its ID from the slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, description, difficulty_level, thumbnail_url')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single() as any

    if (courseError || !course) {
      console.error('Course error:', courseError)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-4">The course "{params.slug}" could not be found.</p>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )
    }

    console.log('Course found:', course.id)

    // Check if user is enrolled
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('status, progress_percentage')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle() as any

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError)
    }

    // If not enrolled, redirect to course page
    if (!enrollment) {
      console.log('User not enrolled, redirecting to course page')
      redirect(`/dashboard/learn/${params.slug}`)
    }

    console.log('User is enrolled')

    // Get the current lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', params.lessonId)
      .eq('is_published', true)
      .maybeSingle() as any

    if (lessonError || !lesson) {
      console.error('Lesson error:', lessonError)
      
      // If lesson not found, try to redirect to the first lesson of the course
      const { data: firstLesson } = await getFirstLesson(course.id)
      if (firstLesson) {
        redirect(`/dashboard/learn/${params.slug}/${firstLesson.id}`)
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Lesson Not Found</h1>
            <p className="text-gray-600 mb-4">The lesson could not be found.</p>
            <Link href={`/dashboard/learn/${params.slug}`} className="text-blue-600 hover:underline">
              Back to Course
            </Link>
          </div>
        </div>
      )
    }

    console.log('Lesson found:', lesson.id)

    // Get the module for this lesson
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', lesson.module_id)
      .single() as any

    if (moduleError || !module) {
      console.error('Module error:', moduleError)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Module Not Found</h1>
            <p className="text-gray-600 mb-4">The module for this lesson could not be found.</p>
            <Link href={`/dashboard/learn/${params.slug}`} className="text-blue-600 hover:underline">
              Back to Course
            </Link>
          </div>
        </div>
      )
    }

    console.log('Module found:', module.id)

    // Verify this lesson belongs to the correct course
    if (module.course_id !== course.id) {
      console.error('Course mismatch:', { moduleCourseId: module.course_id, courseId: course.id })
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Course Mismatch</h1>
            <p className="text-gray-600 mb-4">This lesson does not belong to the specified course.</p>
            <Link href={`/dashboard/learn/${params.slug}`} className="text-blue-600 hover:underline">
              Back to Course
            </Link>
          </div>
        </div>
      )
    }

    // Get user's progress for this lesson
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('completed, completed_at, quiz_score, time_spent, last_position')
      .eq('user_id', user.id)
      .eq('lesson_id', params.lessonId)
      .maybeSingle() as any

    console.log('Progress:', progress)

    // Get all modules for this course
    const { data: courseModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, module_order')
      .eq('course_id', course.id)
      .order('module_order', { ascending: true }) as any

    if (modulesError) {
      console.error('Modules error:', modulesError)
    }

    let allLessons: { id: string; title: string; lesson_order: number; module_order: number }[] = []

    if (courseModules && courseModules.length > 0) {
      const moduleIds = courseModules.map((m: any) => m.id)
      
      const { data: lessons, error: navError } = await supabase
        .from('lessons')
        .select('id, title, lesson_order, module_id')
        .in('module_id', moduleIds)
        .eq('is_published', true) as any

      if (navError) {
        console.error('Navigation error:', navError)
      }

      if (lessons) {
        const moduleOrderMap = new Map()
        courseModules.forEach((module: any) => {
          moduleOrderMap.set(module.id, module.module_order)
        })

        allLessons = lessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          lesson_order: lesson.lesson_order,
          module_order: moduleOrderMap.get(lesson.module_id) || 0
        }))

        allLessons.sort((a, b) => {
          if (a.module_order !== b.module_order) {
            return a.module_order - b.module_order
          }
          return a.lesson_order - b.lesson_order
        })
      }
    }

    const currentIndex = allLessons.findIndex(l => l.id === params.lessonId)
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

    const typedEnrollment = enrollment as Enrollment

    // Check if this is the Lubrication Engineering interactive lesson
    const isLubricationLesson = lesson.id === 'f40673f8-8262-4acb-a098-6a98b1337337'

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Progress bar for course */}
            <div className="h-1 bg-gray-200">
              <div 
                className="h-1 bg-green-500 transition-all duration-300" 
                style={{ width: `${typedEnrollment.progress_percentage || 0}%` }}
              />
            </div>

            <div className="p-8">
              <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>
              
              {/* Module info */}
              <div className="mb-6 text-sm text-gray-500">
                Module: {module.title}
                {module.estimated_minutes && (
                  <span className="ml-2">• {module.estimated_minutes} min total</span>
                )}
              </div>
              
              {/* Conditionally render either the Lubrication module or regular lesson content */}
              {isLubricationLesson ? (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <LubricationModule />
                </div>
              ) : (
                <LessonContent 
                  lesson={lesson}
                  contentType={lesson.content_type || 'video'} 
                />
              )}

              {/* Complete button with form data */}
              <div className="mt-8 flex justify-center">
                {progress?.completed ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                    <CheckCircle size={20} />
                    <span>Lesson Completed</span>
                  </div>
                ) : (
                  <form action={markLessonComplete}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="lessonId" value={params.lessonId} />
                    <input type="hidden" name="slug" value={params.slug} />
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
  } catch (error) {
    console.error('Unexpected error in LessonPage:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">An unexpected error occurred while loading this page.</p>
          <pre className="bg-gray-100 p-4 rounded text-xs mb-4 overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}

// Helper function to get first lesson of a course
async function getFirstLesson(courseId: string) {
  const supabase = await createClient()
  
  const { data: firstModule } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('module_order', { ascending: true })
    .limit(1)
    .single() as any

  if (!firstModule) return { data: null }

  const { data: firstLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', firstModule.id)
    .eq('is_published', true)
    .order('lesson_order', { ascending: true })
    .limit(1)
    .single() as any

  return { data: firstLesson }
}
