import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'

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
  
  // STEP 1: Get the course ID from the slug
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!course) {
    notFound()
  }

  // STEP 2: Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) {
    redirect(`/dashboard/courses/${params.slug}`)
  }

  // STEP 3: Get the first lesson directly using a raw SQL approach
  // First, get all modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
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

  // Get the first lesson from the first module
  const { data: firstLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', modules[0].id)
    .order('lesson_order', { ascending: true })
    .limit(1)
    .single()

  if (!firstLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No lessons found</h1>
          <p className="text-gray-600">The first module has no lessons.</p>
        </div>
      </div>
    )
  }

  // Redirect to the first lesson
  redirect(`/dashboard/learn/${params.slug}/${firstLesson.id}`)
}
