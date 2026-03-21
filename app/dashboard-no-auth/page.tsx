'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardNoAuth() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [cookies, setCookies] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionInfo(session)
      setCookies(document.cookie)
    }
    
    checkSession()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard (No Auth Check)</h1>
      
      <div className="grid gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Session:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Cookies:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {cookies || 'No cookies'}
          </pre>
        </div>

        <div className="flex gap-4">
          <a 
            href="/test-login" 
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Test Login
          </a>
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
  )
}
