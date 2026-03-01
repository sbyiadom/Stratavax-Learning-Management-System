'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // If no user, show message but DON'T redirect
  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Not logged in</h1>
        <p className="mb-4">Please log in to view this page.</p>
        <a href="/login" className="text-blue-600 underline">Go to Login</a>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome, {user.email}!</p>
      <a
        href="/debug"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded mr-2"
      >
        Go to Debug
      </a>
      <a
        href="/login"
        className="inline-block px-4 py-2 bg-gray-600 text-white rounded"
      >
        Go to Login
      </a>
    </div>
  )
}
