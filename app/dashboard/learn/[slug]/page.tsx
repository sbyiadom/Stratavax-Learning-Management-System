import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LearnPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  // First, get the course ID from the slug
  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', params.slug)
    .single()

  if (!course) {
    notFound()
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) {
    redirect(`/dashboard/courses/${params.slug}`)
  }

  // First, get all modules for this course in order
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
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

  if (!modules || modules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No modules found</h1>
          <p className="text-gray-600">This course doesn't have any modules yet.</p>
        </div>
      </div>
    )
  }

  // Flatten and sort all lessons
  const allLessons: { id: string; title: string; lesson_order: number; module_order: number }[] = []
  
  modules.forEach(module => {
    if (module.lessons) {
      module.lessons.forEach((lesson: any) => {
        allLessons.push({
          id: lesson.id,
          title: lesson.title,
          lesson_order: lesson.lesson_order,
          module_order: module.module_order
        })
      })
    }
  })

  // Sort by module_order first, then lesson_order
  allLessons.sort((a, b) => {
    if (a.module_order !== b.module_order) {
      return a.module_order - b.module_order
    }
    return a.lesson_order - b.lesson_order
  })

  if (allLessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No lessons found</h1>
          <p className="text-gray-600">This course doesn't have any lessons yet.</p>
        </div>
      </div>
    )
  }

  // Get completed lessons for this user
  const { data: completedData } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('completed', true)
    .in('lesson_id', allLessons.map(l => l.id))

  const completedLessonIds = new Set(completedData?.map(c => c.lesson_id) || [])

  // Find the first incomplete lesson
  const firstIncompleteLesson = allLessons.find(l => !completedLessonIds.has(l.id))

  // If there's an incomplete lesson, redirect to it
  if (firstIncompleteLesson) {
    redirect(`/dashboard/learn/${params.slug}/${firstIncompleteLesson.id}`)
  }

  // If all lessons are completed, redirect to the first lesson
  redirect(`/dashboard/learn/${params.slug}/${allLessons[0].id}`)
}
