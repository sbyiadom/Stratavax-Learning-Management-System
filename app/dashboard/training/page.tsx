import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TrainingRegistration from '@/components/training/TrainingRegistration'
import TrainingDashboard from '@/components/training/TrainingDashboard'
import { GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrainingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
              <p className="text-gray-500 text-sm">Request and track your training programs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <TrainingRegistration userId={user.id} />
          </div>
          <div className="lg:col-span-2">
            <TrainingDashboard userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
