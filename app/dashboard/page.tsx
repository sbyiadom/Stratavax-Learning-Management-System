'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/app/providers'

export default function DashboardPage() {
  const { user } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    console.log('Dashboard page mounted, user:', user)
  }, [user])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome {user.email}</p>
    </div>
  )
}
