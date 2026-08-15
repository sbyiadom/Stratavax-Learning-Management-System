// components/dashboard/ReplyForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface ReplyFormProps {
  discussionId: string
  courseId: string  // Changed from courseSlug
}

export default function ReplyForm({ discussionId, courseId }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          content: content.trim()
        })

      if (error) throw error

      setContent('')
      router.refresh()
    } catch (error) {
      console.error('Error posting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply..."
        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={!content.trim() || isSubmitting}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isSubmitting ? 'Posting...' : 'Post Reply'}
      </button>
    </form>
  )
}
