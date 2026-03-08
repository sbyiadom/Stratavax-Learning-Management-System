import { createClient } from '@/lib/supabase-server'
import { notFound, permanentRedirect } from 'next/navigation'

export default async function LearnPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  // Get the first lesson ID from the database
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!course) {
    notFound()
  }

  // Get the first module
  const { data: firstModule } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)
    .order('module_order', { ascending: true })
    .limit(1)
    .single()

  if (!firstModule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>No modules found</div>
      </div>
    )
  }

  // Get the first lesson
  const { data: firstLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', firstModule.id)
    .order('lesson_order', { ascending: true })
    .limit(1)
    .single()

  if (!firstLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>No lessons found</div>
      </div>
    )
  }

  // Use permanentRedirect instead of redirect
  permanentRedirect(`/dashboard/learn/${params.slug}/${firstLesson.id}`)
}
