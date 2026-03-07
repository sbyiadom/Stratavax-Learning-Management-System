'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginDebug() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [debug, setDebug] = useState<any[]>([])
  const supabase = createClient()

  const addDebug = (message: string, data?: any) => {
    setDebug(prev => [...prev, { time: new Date().toISOString(), message, data }])
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    addDebug('Attempting login...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      addDebug(`Login error: ${error.message}`, error)
    } else {
      addDebug('Login successful!', { user: data.user?.email })
      
      // Check session right after login
      const { data: { session } } = await supabase.auth.getSession()
      addDebug('Session after login:', { hasSession: !!session })
      
      // Check cookies
      addDebug('Cookies after login:', document.cookie)
      
      // Try to go to dashboard after 2 seconds
      setTimeout(() => {
        addDebug('Redirecting to dashboard...')
        window.location.href = '/dashboard-debug'
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Login</h1>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Login Form */}
          <div className="bg-white p-6 rounded-lg shadow">
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
                className="w-full p-2 bg-blue-600 text-white rounded"
              >
                Login
              </button>
            </form>
          </div>

          {/* Debug Output */}
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-auto">
            {debug.map((d, i) => (
              <div key={i} className="mb-2 border-b border-gray-700 pb-1">
                <div className="text-xs text-gray-500">{d.time.split('T')[1].split('.')[0]}</div>
                <div>{d.message}</div>
                {d.data && (
                  <pre className="text-xs text-yellow-400 ml-2">
                    {JSON.stringify(d.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
