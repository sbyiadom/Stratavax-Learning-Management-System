'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cookies, setCookies] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
      setCookies(document.cookie)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link href="/login" className="text-blue-600 mr-4">← Back to Login</Link>
        <Link href="/dashboard" className="text-blue-600">Go to Dashboard</Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      
      <div className="grid gap-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Session Status:</h2>
          <pre className="bg-white p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Cookies:</h2>
          <pre className="bg-white p-4 rounded overflow-auto">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        {!session && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">
              No active session. Please try logging in again.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
