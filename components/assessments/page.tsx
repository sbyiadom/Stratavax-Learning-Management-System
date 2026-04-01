import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare, Award, Calendar, Clock, ChevronRight, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AssessmentsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assessments } = await supabase
    .from('knowledge_assessments')
    .select(`
      *,
      training_registrations (
        course_title,
        training_date,
        status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-green-600 rounded-xl flex items-center justify-center">
              <CheckSquare className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Assessments</h1>
              <p className="text-gray-500 text-sm">View your pre and post training assessment results</p>
            </div>
          </div>
        </div>

        {assessments && assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => {
              const improvement = assessment.post_assessment_score && assessment.pre_assessment_score
                ? assessment.post_assessment_score - assessment.pre_assessment_score
                : null
              
              return (
                <Link
                  key={assessment.id}
                  href={`/dashboard/assessments/${assessment.registration_id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition">
                        {assessment.training_registrations?.course_title || assessment.course_title}
                      </h3>
                      <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pre-Assessment:</span>
                        <span className="font-medium">
                          {assessment.pre_assessment_score !== null ? `${assessment.pre_assessment_score}%` : 'Not taken'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Post-Assessment:</span>
                        <span className={`font-medium ${assessment.post_assessment_score && assessment.post_assessment_score >= assessment.pass_mark ? 'text-green-600' : 'text-red-600'}`}>
                          {assessment.post_assessment_score !== null ? `${assessment.post_assessment_score}%` : 'Not taken'}
                        </span>
                      </div>
                      {improvement !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Improvement:</span>
                          <span className={`font-medium ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {improvement > 0 ? '+' : ''}{improvement}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View Details
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Complete a training course and add your assessment results to track your knowledge improvement.
            </p>
            <Link
              href="/dashboard/training"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Training Programs
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
