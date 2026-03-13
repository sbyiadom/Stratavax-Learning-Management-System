import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { 
  Users, BookOpen, FileText, Settings, BarChart, 
  Calendar, MessageSquare, Award, ArrowRight, GraduationCap,
  TrendingUp, UserPlus, Clock, CheckCircle, AlertCircle,
  User
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalAssignments },
    { count: pendingReviews },
    { count: activeSupervisors },
    { count: recentEnrollments },
    { data: recentActivity }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('assignments').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('activity_logs')
      .select(`
        *,
        profiles:user_id (first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const { count: lastMonthUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', lastMonth.toISOString())

  const userGrowth = lastMonthUsers ? Math.round((lastMonthUsers / (totalUsers || 1)) * 100) : 0

  return (
    <div className="min-h-screen relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('/images/admin-bg.jpg')`,
        }}
      />
      
      {/* White Overlay Layer */}
      <div className="absolute inset-0 bg-white/95" />
      
      {/* Content Layer */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <GraduationCap className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                <TrendingUp size={14} />
                {userGrowth}% growth this month
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* ... rest of your stats cards ... */}
          </div>

          {/* Quick Actions */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* ... your quick action links ... */}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.profiles?.first_name} {activity.profiles?.last_name} • {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.type === 'enrollment' ? 'bg-green-100 text-green-700' :
                      activity.type === 'submission' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {activity.type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
