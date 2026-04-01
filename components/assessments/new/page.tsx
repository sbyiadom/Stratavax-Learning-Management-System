import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import KnowledgeAssessment from '@/components/assessments/KnowledgeAssessment'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewAssessmentPage({
  searchParams
}: {
  searchParams: { registration?: string; course?: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const registrationId = searchParams.registration
  const courseTitle = searchParams.course ? decodeURIComponent(searchParams.course) : ''

  if (!registrationId) {
    redirect('/dashboard/training')
  }

  // Verify the registration belongs to the user
  const { data: registration } = await supabase
    .from('training_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .single()

  if (!registration) {
    redirect('/dashboard/training')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard/training"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Training
        </Link>

        <KnowledgeAssessment
          registrationId={registrationId}
          courseTitle={courseTitle || registration.course_title}
          userId={user.id}
        />
      </div>
    </div>
  )
}
