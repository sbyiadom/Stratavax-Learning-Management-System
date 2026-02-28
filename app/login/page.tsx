'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/app/providers'

export default function LoginPage() {
  const { user } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Login Page</h1>
        <p className="text-gray-600">Check console for redirect logs</p>
      </div>
    </div>
  )
}
