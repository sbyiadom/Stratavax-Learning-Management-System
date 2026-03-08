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

  // Get all lessons for this course with their modules
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      lesson_order,
      module:modules!inner(
        id,
        module_order,
        course_id
      )
    `)
    .eq('module.course_id', course.id)
    .order('module.module_order', { ascending: true })
    .order('lesson_order', { ascending: true })

  if (!lessons || lessons.length === 0) {
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
    .in('lesson_id', lessons.map(l => l.id))

  const completedLessonIds = new Set(completedData?.map(c => c.lesson_id) || [])

  // Find the first incomplete lesson
  const firstIncompleteLesson = lessons.find(l => !completedLessonIds.has(l.id))

  // If there's an incomplete lesson, redirect to it
  if (firstIncompleteLesson) {
    redirect(`/dashboard/learn/${params.slug}/${firstIncompleteLesson.id}`)
  }

  // If all lessons are completed, redirect to the first lesson
  redirect(`/dashboard/learn/${params.slug}/${lessons[0].id}`)
}
