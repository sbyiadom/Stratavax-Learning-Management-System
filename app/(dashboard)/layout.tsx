'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import DashboardHeader from '@/components/dashboard/Header'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
            </div>
          </div>
        </header>
        <div className="flex">
          <div className="w-64 bg-white border-r h-screen p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          <main className="flex-1 p-6 lg:p-8">
            <div className="space-y-6">
              <div className="h-8 bg-gray-100 rounded w-48 animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
