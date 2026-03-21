'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardDebug() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cookies, setCookies] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionInfo(session)
      setCookies(document.cookie)
      setLoading(false)
    }
    
    checkSession()

    // Also check auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      setSessionInfo(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="font-semibold mb-2">Session Status:</h2>
          {sessionInfo ? (
            <div className="bg-green-50 p-4 rounded">
              <p className="text-green-700">✓ Session active for: {sessionInfo.user?.email}</p>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded">
              <p className="text-red-700">✗ No active session</p>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Session Data:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Cookies:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {cookies || 'No cookies found'}
            </pre>
          </div>

          <div className="flex gap-4">
            <Link 
              href="/login-debug" 
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Back to Login Debug
            </Link>
            <Link 
              href="/api/auth-status" 
              className="px-4 py-2 bg-gray-600 text-white rounded"
              target="_blank"
            >
              Check Auth Status API
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.reload()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
