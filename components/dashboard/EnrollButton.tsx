'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PlayCircle } from 'lucide-react'

interface EnrollButtonProps {
  courseId: string
  courseSlug: string
}

export default function EnrollButton({ courseId, courseSlug }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleEnroll = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (existing) {
        // Already enrolled, just redirect
        router.push(`/dashboard/learn/${courseSlug}`)
        router.refresh()
        return
      }

      // Create enrollment
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress: 0,
          last_accessed_at: new Date().toISOString(),
        })

      if (enrollError) {
        console.error('Enrollment error:', enrollError)
        setError(enrollError.message)
        setLoading(false)
        return
      }

      // Success - redirect to the course learning page
      router.push(`/dashboard/learn/${courseSlug}`)
      router.refresh()
      
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || 'Failed to enroll in course')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        <PlayCircle size={18} />
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
