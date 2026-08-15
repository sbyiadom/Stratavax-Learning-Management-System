'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Award, Download, Share2, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import CertificatePDF from '@/components/CertificatePDF'

export default function CertificatePage({ params }: { params: { courseId: string } }) {
  const [user, setUser] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)
        
        // Get course by ID
        const { data: course } = await supabase
          .from('courses')
          .select('id, title, slug, description, category')
          .eq('id', params.courseId)
          .single()
        setCourse(course)
        
        if (!course) {
          setError('Course not found')
          setLoading(false)
          return
        }
        
        // Get enrollment
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('progress_percentage, completed_at, status')
          .eq('user_id', user.id)
          .eq('course_id', params.courseId)
          .single()
        setEnrollment(enrollment)
        
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()
        setProfile(profile)
        
      } catch (err) {
        setError('Failed to load certificate data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [params.courseId, router])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Certificate not found'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  const userName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Learner'
  
  const certificateId = `${course.slug}-${user?.id?.substring(0, 8) || 'USER'}`.toUpperCase()
  
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
  
  const isComplete = enrollment?.progress_percentage === 100 || enrollment?.status === 'completed'
  
  if (!isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Certificate Not Available</h2>
            <p className="text-gray-600 mb-6">
              You need to complete all lessons in this course to earn your certificate.
            </p>
            <Link 
              href={`/dashboard/learn/${course.id}`}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Continue Learning
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        
        {/* Certificate Preview */}
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
            
            <p className="text-gray-600 mb-6">On this day, {completionDate}</p>
            
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
          <PDFDownloadLink
            document={
              <CertificatePDF
                userName={userName}
                courseTitle={course.title}
                completionDate={completionDate}
                certificateId={certificateId}
              />
            }
            fileName={`certificate-${course.slug}.pdf`}
          >
            {({ loading }) => (
              <span className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download PDF
                  </>
                )}
              </span>
            )}
          </PDFDownloadLink>
          
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
            href={`/dashboard/learn/${course.id}`}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <CheckCircle size={18} />
            Review Course
          </Link>
        </div>
      </div>
    </div>
  )
}
