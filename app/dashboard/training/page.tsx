'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function TrainingPage() {
  const router = useRouter()
  
  // Google Form URL for Training Registration
  const TRAINING_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform'

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      // Redirect to Google Form
      window.location.href = TRAINING_FORM_URL
    }
    
    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to training registration form...</p>
      </div>
    </div>
  )
}
