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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Please log in to enroll')
        router.push('/login')
        return
      }

      console.log('Enrolling user:', user.id, 'in course:', courseId)

      // Check if already enrolled
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      console.log('Existing enrollment check:', existingEnrollment, checkError)

      if (existingEnrollment) {
        // Already enrolled - redirect to learning page
        router.push(`/dashboard/learn/${courseSlug}`)
        return
      }

      // Insert enrollment - using only fields that exist
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percentage: 0,
          enrolled_at: new Date().toISOString()
        })

      console.log('Enrollment result:', enrollError)

      if (enrollError) {
        console.error('Enrollment error details:', enrollError)
        
        // Provide more specific error message
        if (enrollError.code === '23503') {
          setError('Profile not found. Please log out and log back in.')
        } else if (enrollError.code === '23505') {
          setError('You are already enrolled in this course')
        } else {
          setError(`Failed to enroll: ${enrollError.message}`)
        }
        setIsLoading(false)
        return
      }

      // Update course enrollment count (optional - ignore if fails)
      try {
        const { error: updateError } = await supabase
          .from('courses')
          .update({ 
            enrollment_count: supabase.rpc('increment', { row_count: 1 })
          })
          .eq('id', courseId)
        
        if (updateError) {
          console.log('Could not update enrollment count:', updateError)
        }
      } catch (err) {
        console.log('Could not update enrollment count:', err)
      }

      setSuccess(true)
      // Redirect after a moment
      setTimeout(() => {
        router.push(`/dashboard/learn/${courseSlug}`)
      }, 1500)
      
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium">
        <CheckCircle size={18} />
        Enrolled! Redirecting...
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={handleEnroll}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Enrolling...
          </>
        ) : (
          <>
            <BookOpen size={18} />
            Enroll Now
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
