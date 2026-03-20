import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function DebugLearnPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get course ID from slug
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', params.slug)
    .single()

  if (!course) {
    return <div className="p-8">Course not found: {params.slug}</div>
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user?.id)
    .eq('course_id', course.id)
    .single()

  // Get all modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      module_order,
      lessons (
        id,
        title,
        lesson_order,
        content_type
      )
    `)
    .eq('course_id', course.id)
    .order('module_order', { ascending: true })

  // Get all lessons in order
  const allLessons = modules?.flatMap(m => 
    m.lessons?.map(l => ({
      ...l,
      moduleTitle: m.title,
      moduleOrder: m.module_order
    })) || []
  ).sort((a, b) => {
    if (a.moduleOrder !== b.moduleOrder) return a.moduleOrder - b.moduleOrder
    return a.lesson_order - b.lesson_order
  }) || []

  // Get completed lessons
  const { data: completed } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user?.id)
    .eq('completed', true)

  const completedIds = new Set(completed?.map(c => c.lesson_id) || [])

  // Find first incomplete
  const firstIncomplete = allLessons.find(l => !completedIds.has(l.id))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: {course.title}</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">Course Info:</h2>
        <p>Course ID: {course.id}</p>
        <p>Course Slug: {course.slug}</p>
        <p>User ID: {user?.id}</p>
        <p>Enrolled: {enrollment ? '✅ Yes' : '❌ No'}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Lessons in Order:</h2>
        {allLessons.map((lesson, index) => (
          <div 
            key={lesson.id} 
            className={`p-3 mb-2 rounded-lg border ${
              completedIds.has(lesson.id) ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 mr-2">#{index + 1}</span>
                <span className="font-medium">{lesson.title}</span>
                <span className="text-xs text-gray-500 ml-2">({lesson.content_type})</span>
                <div className="text-xs text-gray-400 mt-1">
                  Module: {lesson.moduleTitle} | Lesson ID: {lesson.id}
                </div>
              </div>
              {completedIds.has(lesson.id) && (
                <span className="text-green-600 text-sm">✅ Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 p-4 bg-yellow-50 rounded-lg">
        <h2 className="font-semibold mb-2">First Incomplete Lesson:</h2>
        {firstIncomplete ? (
          <div>
            <p>Title: {firstIncomplete.title}</p>
            <p>Lesson ID: {firstIncomplete.id}</p>
            <p>Module: {firstIncomplete.moduleTitle}</p>
            <Link 
              href={`/dashboard/learn/${params.slug}/${firstIncomplete.id}`}
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to First Incomplete Lesson
            </Link>
          </div>
        ) : (
          <p>No incomplete lessons found. All lessons completed!</p>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-2">Manual Lesson Links:</h2>
        <div className="space-y-2">
          {allLessons.map(lesson => (
            <Link
              key={lesson.id}
              href={`/dashboard/learn/${params.slug}/${lesson.id}`}
              className="block text-blue-600 hover:underline"
            >
              {lesson.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
