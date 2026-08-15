// app/dashboard/certificates/[courseId]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Download, Share2, CheckCircle, ArrowLeft } from 'lucide-react'

export default async function CertificatePage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, category')
    .eq('id', params.courseId)
    .single()
  
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The certificate you\'re looking for doesn\'t exist.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }
  
  // Check if user has completed the course
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress_percentage, completed_at, status')
    .eq('user_id', user.id)
    .eq('course_id', params.courseId)
    .single()
  
  const isComplete = enrollment?.progress_percentage === 100 || enrollment?.status === 'completed'
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()
  
  const userName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user.email?.split('@')[0] || 'Learner'
  
  const certificateId = `${course.slug}-${user.id.substring(0, 8)}`.toUpperCase()
  
  const completionDate = enrollment?.completed_at 
    ? new Date(enrollment.completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        
        {!isComplete ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Certificate Not Available</h2>
            <p className="text-gray-600 mb-6">
              You need to complete all lessons in this course to earn your certificate.
            </p>
            <Link 
              href={`/dashboard/learn/${course.slug}`}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Continue Learning
            </Link>
          </div>
        ) : (
          <>
            {/* Certificate */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-8 border-b border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award size={32} className="text-amber-600" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Certificate of Completion</h1>
                      <p className="text-gray-600">Proudly presented to</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600">Certificate ID</div>
                    <div className="text-xs font-mono text-gray-500">{certificateId}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-12 text-center">
                <div className="mb-4">
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">{userName}</h2>
                  <p className="text-gray-600">has successfully completed</p>
                </div>
                
                <div className="my-6 p-4 border-2 border-amber-200 rounded-lg bg-amber-50/50">
                  <h3 className="text-2xl font-bold text-gray-800">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{course.category || 'Professional Development'}</p>
                </div>
                
                <p className="text-gray-600 mb-6">
                  On this day, {completionDate}
                </p>
                
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="w-2 h-8 bg-amber-500 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Stratavax Academy</p>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-8 bg-amber-500 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Verified</p>
                  </div>
                </div>
                
                <div className="mt-6 text-xs text-gray-400">
                  This certificate is awarded to {userName} for completing all course requirements.
                  Certificate ID: {certificateId}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Certificate - ${course.title}`,
                      url: window.location.href
                    })
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Share2 size={18} />
                Share
              </button>
              <Link 
                href={`/dashboard/learn/${course.slug}`}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <CheckCircle size={18} />
                Review Course
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
