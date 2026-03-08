import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import LessonContent from '@/components/dashboard/LessonContent'

// Define types to help TypeScript
type ModuleWithCourse = {
  id: string
  title: string
  module_order: number
  course_id: string
}

type LessonWithModule = {
  id: string
  title: string
  content_type: string
  content: any
  lesson_order: number
  module_id: string
  module: ModuleWithCourse
}

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // First, get the current lesson with its module and course info
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      content_type,
      content,
      lesson_order,
      module_id,
      module:modules(
        id,
        title,
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

  // Cast to our type
  const typedLesson = lesson as unknown as LessonWithModule

  // Get the course_id from the module
  const courseId = typedLesson.module?.course_id

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">Course ID not found for this lesson.</p>
          <Link 
            href={`/dashboard/learn/${params.slug}`}
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  // Get all lessons in this course for navigation
  const { data: allLessons, error: navError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      lesson_order,
      module:modules!inner(
        module_order
      )
    `)
    .eq('module.course_id', courseId)
    .order('module.module_order', { ascending: true })
    .order('lesson_order', { ascending: true })

  if (navError) {
    console.error('Navigation error:', navError)
  }

  // Find current index and navigation lessons
  const currentIndex = allLessons?.findIndex(l => l.id === params.lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length || 0) - 1 ? allLessons?.[currentIndex + 1] : null

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
                Lesson {typedLesson.lesson_order} • {typedLesson.content_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">{typedLesson.title}</h1>
          
          <LessonContent lesson={typedLesson} contentType={typedLesson.content_type} />

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

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
          <p><strong>Debug:</strong> Lesson ID: {typedLesson.id} | Course ID: {courseId}</p>
        </div>
      </div>
    </div>
  )
}
