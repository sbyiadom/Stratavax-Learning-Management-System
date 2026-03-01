'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestSession() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    setSessionInfo(session)

    // List all cookies
    setCookies(document.cookie.split(';').map(c => c.trim()))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    checkSession()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Session Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Session Status:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Cookies:</h2>
        <ul className="bg-gray-100 p-4 rounded">
          {cookies.map((cookie, i) => (
            <li key={i} className="font-mono text-sm">{cookie}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Sign Out
      </button>

      <p className="mt-4 text-sm text-gray-600">
        Visit <a href="/login" className="text-blue-600 hover:underline">/login</a> to sign in
      </p>
    </div>
  )
}
