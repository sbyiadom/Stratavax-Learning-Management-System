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
        .single()

      if (existing) {
        router.push(`/dashboard/learn/${courseSlug}`)
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
        })

      if (enrollError) throw enrollError

      router.push(`/dashboard/learn/${courseSlug}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course')
    } finally {
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
