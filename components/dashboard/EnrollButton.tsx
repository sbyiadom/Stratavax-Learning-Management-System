'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { BookOpen, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface EnrollButtonProps {
  courseId: string
  courseSlug: string
}

export default function EnrollButton({ courseId, courseSlug }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEnroll = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Please log in to enroll')
        router.push('/login')
        return
      }

      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (existingEnrollment) {
        setError('Already enrolled')
        setIsLoading(false)
        return
      }

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percentage: 0,
          enrolled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (enrollError) {
        console.error('Enrollment error:', enrollError)
        setError('Failed to enroll. Please try again.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push(`/dashboard/learn/${courseSlug}`), 1500)
      
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium"><CheckCircle size={18} /> Enrolled! Redirecting...</div>
  }

  return (
    <div className="w-full">
      <button onClick={handleEnroll} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-sm disabled:opacity-50">
        {isLoading ? <><Loader2 size={18} className="animate-spin" /> Enrolling...</> : <><BookOpen size={18} /> Enroll Now</>}
      </button>
      {error && <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-1"><AlertCircle size={12} className="text-red-500 mt-0.5" /><p className="text-xs text-red-700">{error}</p></div>}
    </div>
  )
}
