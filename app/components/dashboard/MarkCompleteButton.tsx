'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'

interface MarkCompleteButtonProps {
  lessonId: string
  courseSlug: string
  isCompleted: boolean
  nextLessonId?: string
}

export default function MarkCompleteButton({ 
  lessonId, 
  courseSlug, 
  isCompleted,
  nextLessonId 
}: MarkCompleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(isCompleted)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleMarkComplete = async () => {
    if (completed) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

      if (existing) {
        await supabase
          .from('lesson_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          })
      }

      setCompleted(true)

      if (nextLessonId) {
        router.push(`/dashboard/learn/${courseSlug}/${nextLessonId}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-400 text-white rounded-lg"
      >
        Loading...
      </button>
    )
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle size={20} />
        <span className="text-sm font-medium">Completed</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleMarkComplete}
      disabled={loading}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
    >
      {loading ? 'Marking...' : 'Mark as Complete'}
    </button>
  )
}
