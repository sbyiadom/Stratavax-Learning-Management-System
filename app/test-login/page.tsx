'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Attempting login...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setStatus(`❌ Error: ${error.message}`)
    } else {
      setStatus(`✅ Success! Logged in as: ${data.user?.email}`)
      
      // Manually check what cookies we have
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        setStatus(prev => prev + `\nSession exists: ${!!session}`)
        
        // Try to access dashboard directly
        window.location.href = '/dashboard-no-auth'
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Test Login (No Middleware)</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
          <button 
            type="submit" 
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Login
          </button>
        </form>
        
        {status && (
          <pre className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">
            {status}
          </pre>
        )}
      </div>
    </div>
  )
}
