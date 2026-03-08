import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function LearnPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  
  // Hard-coded first lesson ID from your debug output
  const firstLessonId = 'fcfdff91-b8af-4440-8cc6-5453095c8105'
  
  // Force redirect to the first lesson
  redirect(`/dashboard/learn/${params.slug}/${firstLessonId}`)
  
  // This will never be rendered
  return null
}
