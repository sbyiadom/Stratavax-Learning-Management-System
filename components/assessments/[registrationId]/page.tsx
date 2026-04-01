import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import KnowledgeAssessment from '@/components/assessments/KnowledgeAssessment'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AssessmentDetailPage({
  params
}: {
  params: { registrationId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: registration } = await supabase
    .from('training_registrations')
    .select('*')
    .eq('id', params.registrationId)
    .eq('user_id', user.id)
    .single()

  if (!registration) {
    notFound()
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
          registrationId={params.registrationId}
          courseTitle={registration.course_title}
          userId={user.id}
        />
      </div>
    </div>
  )
}
