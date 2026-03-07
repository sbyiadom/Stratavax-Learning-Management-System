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
  }, [supabase])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="mb-4 space-x-4">
        <Link href="/login" className="text-blue-600 hover:underline">← Login</Link>
        <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
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

        {session ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">
              ✓ Active session found. You should be able to access the dashboard.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">
              No active session. Please try logging in again.
            </p>
          </div>
        )}
      </div>

      {/* Manual session check */}
      <div className="mt-6">
        <button
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession()
            alert(session ? 'Session exists' : 'No session')
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Manual Session Check
        </button>
      </div>
    </div>
  )
}
