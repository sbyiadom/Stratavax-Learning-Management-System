import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

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
  
  // Map course slugs to their first lesson IDs
  const firstLessonMap: Record<string, string> = {
    'basic-computer-literacy': 'fcfdff91-b8af-4440-8cc6-5453095c8105',
    'emotional-intelligence': '6d4f1308-3cf6-4c60-93aa-cb198faa384d', // Replace with actual ID
    // Add more mappings as needed
  }
  
  const firstLessonId = firstLessonMap[params.slug]
  
  if (firstLessonId) {
    redirect(`/dashboard/learn/${params.slug}/${firstLessonId}`)
  }
  
  // If no mapping exists, try to get from database
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (course) {
    const { data: firstModule } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', course.id)
      .order('module_order', { ascending: true })
      .limit(1)
      .single()

    if (firstModule) {
      const { data: firstLesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('module_id', firstModule.id)
        .order('lesson_order', { ascending: true })
        .limit(1)
        .single()

      if (firstLesson) {
        redirect(`/dashboard/learn/${params.slug}/${firstLesson.id}`)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No lessons found</h1>
        <p className="text-gray-600">This course doesn't have any lessons yet.</p>
      </div>
    </div>
  )
}
