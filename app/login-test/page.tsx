'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginTestPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setMessage('Logging in...')
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Success! User: ${data.user?.email}`)
      // Check if session exists
      const { data: session } = await supabase.auth.getSession()
      console.log('Session:', session)
      
      // Force redirect after 1 second
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Test Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Login
        </button>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </div>
  )
}
