'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('Dashboard - User:', user ? 'logged in' : 'not logged in')
      
      if (!user) {
        console.log('No user, redirecting to login')
        router.push('/login')
        return
      }
      
      setUser(user)
      setLoading(false)
    }
    
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}!</h2>
        <p className="text-gray-600 mb-4">You are successfully logged in.</p>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-2">Session Info:</h3>
          <p className="text-sm">User ID: {user.id}</p>
          <p className="text-sm">Last Sign In: {new Date(user.last_sign_in_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          href="/debug"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Debug
        </a>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
