'use client'

import { useState } from 'react'
import { useSupabase } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MicrosoftFormIntegrationProps {
  lessonId: string
  courseId: string
}

export default function MicrosoftFormIntegration({ lessonId, courseId }: MicrosoftFormIntegrationProps) {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  const fetchFormData = async () => {
    setLoading(true)
    try {
      // Fetch form integration data from your API
      const response = await fetch(`/api/microsoft-forms/${lessonId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch form data')
      }
      
      const data = await response.json()
      setFormData(data)
      setShowForm(true)
    } catch (error) {
      console.error('Error fetching form:', error)
      toast.error('Failed to load form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitFormResponse = async (responses: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/microsoft-forms/${lessonId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          courseId,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      toast.success('Form submitted successfully!')
      
      // Mark lesson as complete or update progress
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user?.id,
          lesson_id: lessonId,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })

    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to access forms</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold">Microsoft Form</h3>
      </div>

      {!showForm ? (
        <div className="text-center py-4">
          <p className="text-gray-600 mb-4">
            This lesson includes a Microsoft Form. Click below to open it.
          </p>
          <Button
            onClick={fetchFormData}
            disabled={loading}
            className="flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {loading ? 'Loading...' : 'Open Form'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Microsoft Form Embed */}
          {formData?.embedUrl && (
            <iframe
              src={formData.embedUrl}
              className="w-full h-[600px] border-0"
              title="Microsoft Form"
            />
          )}

          {/* Manual submission button if needed */}
          <div className="flex justify-end">
            <Button
              onClick={() => submitFormResponse({})}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Submitting...' : 'Mark as Completed'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
