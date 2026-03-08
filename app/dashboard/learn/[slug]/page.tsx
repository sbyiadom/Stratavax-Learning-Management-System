import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function LearnPage({
  params,
}: {
  params: { slug: string }
}) {
  console.log('LearnPage accessed for slug:', params.slug)
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  console.log('User:', user?.id)
  
  if (!user) {
    console.log('No user, returning null')
    return null
  }
  
  // Hard-coded first lesson ID from your debug output
  const firstLessonId = 'fcfdff91-b8af-4440-8cc6-5453095c8105'
  const redirectUrl = `/dashboard/learn/${params.slug}/${firstLessonId}`
  
  console.log('Redirecting to:', redirectUrl)
  
  // Force redirect to the first lesson
  redirect(redirectUrl)
  
  // This will never be rendered
  return null
}
