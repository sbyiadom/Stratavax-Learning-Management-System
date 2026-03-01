'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DebugPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    setSessionData(session)

    // Get cookies
    setCookies(document.cookie.split(';').map(c => c.trim()))
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with your test user
      password: 'password123',
    })
    if (!error) {
      window.location.href = '/debug'
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/debug'
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Session:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Cookies:</h2>
        <ul className="bg-gray-100 p-4 rounded">
          {cookies.map((cookie, i) => (
            <li key={i} className="font-mono text-sm break-all">{cookie}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Test Sign In
        </button>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Sign Out
        </button>
        <a
          href="/login"
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Go to Login
        </a>
      </div>
    </div>
  )
}
