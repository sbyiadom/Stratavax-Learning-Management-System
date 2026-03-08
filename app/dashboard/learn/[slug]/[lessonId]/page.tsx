import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import LessonContent from '@/components/dashboard/LessonContent'

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

  // Get lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      content_type,
      content,
      lesson_order,
      module:modules(
        id,
        title,
        module_order,
        course_id
      )
    `)
    .eq('id', params.lessonId)
    .single()

  if (!lesson) {
    notFound()
  }

  // Get all lessons for navigation
  const { data: allLessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      lesson_order,
      module:modules!inner(
        module_order
      )
    `)
    .eq('module.course_id', lesson.module.course_id)
    .order('module.module_order', { ascending: true })
    .order('lesson_order', { ascending: true })

  // Find current index
  const currentIndex = allLessons?.findIndex(l => l.id === params.lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length || 0) - 1 ? allLessons?.[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/dashboard/learn/${params.slug}`}
          className="text-blue-600 hover:underline flex items-center gap-2 mb-6"
        >
          <ChevronLeft size={16} />
          Back to Course
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>
          
          <LessonContent lesson={lesson} contentType={lesson.content_type} />

          <div className="mt-8 flex justify-between">
            {prevLesson ? (
              <Link
                href={`/dashboard/learn/${params.slug}/${prevLesson.id}`}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Previous
              </Link>
            ) : <div />}
            
            {nextLesson ? (
              <Link
                href={`/dashboard/learn/${params.slug}/${nextLesson.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </Link>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  )
}
