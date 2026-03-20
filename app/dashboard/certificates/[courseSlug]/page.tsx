import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Download, Share2, ChevronLeft } from 'lucide-react'

export default async function CertificatePage({
  params,
}: {
  params: { courseSlug: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Fetch course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.courseSlug)
    .single()

  if (!course) {
    notFound()
  }

  // Check if user completed the course
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment || enrollment.progress < 100) {
    redirect(`/dashboard/learn/${params.courseSlug}`)
  }

  // Check if certificate already exists
  let { data: certificate } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  // Generate new certificate if it doesn't exist
  if (!certificate) {
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    const { data: newCertificate } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: course.id,
        issue_date: new Date().toISOString(),
        certificate_number: certificateNumber,
        grade: 'Pass'
      })
      .select()
      .single()

    certificate = newCertificate
  }

  const issueDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/dashboard/learn/${params.courseSlug}`}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Back to Course
          </Link>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/10 to-blue-600/10 rounded-full -ml-32 -mb-32"></div>
          
          <div className="relative">
            {/* Header */}
            <div className="text-center mb-8">
              <Award size={64} className="text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h1>
              <p className="text-gray-600">This certificate is proudly presented to</p>
            </div>

            {/* Recipient Name */}
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-gray-900 mb-2 border-b-2 border-yellow-400 inline-block pb-2">
                {user.email?.split('@')[0]}
              </div>
            </div>

            {/* Course Info */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-2">for successfully completing the course</p>
              <h2 className="text-2xl font-bold text-blue-600 mb-4">{course.title}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{course.description}</p>
            </div>

            {/* Details */}
            <div className="flex justify-center gap-12 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="font-semibold">{issueDate}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Certificate ID</p>
                <p className="font-semibold font-mono text-sm">{certificate.certificate_number}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-semibold text-green-600">Pass</p>
              </div>
            </div>

            {/* Seal */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-yellow-400 flex items-center justify-center">
                <Award size={40} className="text-yellow-500" />
              </div>
            </div>

            {/* Signature */}
            <div className="text-center text-sm text-gray-500">
              <p>Authorized by</p>
              <p className="font-semibold text-gray-700">Learning Platform</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={18} />
            Download PDF
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Certificate link copied to clipboard!')
            }}
            className="flex items-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>

        {/* Verification Note */}
        <p className="text-center text-sm text-gray-500 mt-4">
          This certificate can be verified at {process.env.NEXT_PUBLIC_SITE_URL}/verify/{certificate.certificate_number}
        </p>
      </div>
    </div>
  )
}
