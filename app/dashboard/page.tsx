import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, FileSpreadsheet, CheckSquare, ExternalLink, Users, Award } from 'lucide-react'
import TrainingRecordsList from '@/components/training/TrainingRecordsList'

export const dynamic = 'force-dynamic'

export default async function TrainingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  const isSupervisor = profile?.role === 'admin' || profile?.role === 'supervisor'

  // Fetch training records with profile info
  let trainingRecords = []
  if (isSupervisor) {
    const { data } = await supabase
      .from('training_records')
      .select(`
        *,
        profiles (
          first_name,
          last_name
        )
      `)
      .order('training_date', { ascending: false })
      .limit(10)
    trainingRecords = data || []
  } else {
    const { data } = await supabase
      .from('training_records')
      .select(`
        *,
        profiles (
          first_name,
          last_name
        )
      `)
      .eq('user_id', user.id)
      .order('training_date', { ascending: false })
    trainingRecords = data || []
  }

  // Google Forms URLs
  const googleForms = {
    courseRequest: 'https://docs.google.com/forms/d/1MrfphacCUS2ZBHOLpnjCq6FWAx32YsEF2OvuPnRGm08/edit',
    trainingEvaluation: 'https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
              <p className="text-gray-500 text-sm">
                {isSupervisor ? 'Manage training records and assessments' : 'Track your training and assessments'}
              </p>
            </div>
          </div>
        </div>

        {/* Google Forms Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {isSupervisor && (
            <a
              href={googleForms.courseRequest}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition">
                  <FileSpreadsheet className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Request New Course</h3>
                  <p className="text-sm text-gray-500">Submit courses to be added to the training catalog</p>
                  <div className="flex items-center gap-1 mt-3 text-sm text-purple-600">
                    Open Form <ExternalLink size={14} />
                  </div>
                </div>
              </div>
            </a>
          )}

          <a
            href={googleForms.trainingEvaluation}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
                <Users className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Training Registration & Evaluation</h3>
                <p className="text-sm text-gray-500">Register attendance and evaluate completed training</p>
                <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
                  Open Form <ExternalLink size={14} />
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* Training Records */}
        <div className="mb-8">
          <TrainingRecordsList 
            records={trainingRecords} 
            isSupervisor={isSupervisor}
            userId={user.id}
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/assessments"
            className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl border border-teal-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CheckSquare className="text-teal-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Knowledge Assessments</h3>
                <p className="text-sm text-gray-600">View all pre/post assessment results</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/assessments/new"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Award className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Add Assessment</h3>
                <p className="text-sm text-gray-600">Add pre/post assessment for completed training</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
