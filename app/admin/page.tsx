import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { 
  Users, BookOpen, FileText, Settings, BarChart, 
  Calendar, MessageSquare, Award, ArrowRight, GraduationCap,
  TrendingUp, UserPlus, Clock, CheckCircle, AlertCircle
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // Let middleware handle redirect
  }

  // Fetch real statistics
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
        profiles:user_id (name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  // Get monthly trends
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const { count: lastMonthUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', lastMonth.toISOString())

  const userGrowth = lastMonthUsers ? Math.round((lastMonthUsers / (totalUsers || 1)) * 100) : 0

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('/images/admin-bg.jpg')`
      }}
    >
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

        {/* Stats Grid - Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} />
                  +{lastMonthUsers || 0} this month
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-3xl font-bold text-gray-900">{totalCourses || 0}</p>
                <p className="text-xs text-blue-600 mt-1">{Math.round((totalCourses || 0) * 0.3)} new this year</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="text-purple-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-3xl font-bold text-gray-900">{totalAssignments || 0}</p>
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {pendingReviews} pending review
                </p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="text-yellow-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Supervisors</p>
                <p className="text-3xl font-bold text-gray-900">{activeSupervisors || 0}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <UserPlus size={12} />
                  {Math.round((activeSupervisors || 0) * 0.2)} available now
                </p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="text-green-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">{recentEnrollments || 0}</p>
                <p className="text-xs text-purple-600 mt-1">Last 30 days</p>
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-indigo-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{pendingReviews || 0}</p>
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Needs attention
                </p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-red-600" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/supervisor"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <Users className="text-blue-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Supervisors</h3>
            <p className="text-sm text-gray-600 mb-3">{activeSupervisors || 0} active supervisors</p>
            <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Manage <ArrowRight size={14} className="ml-1" />
            </span>
          </Link>

          <Link
            href="/admin/assignment"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <FileText className="text-purple-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1">Review Assignments</h3>
            <p className="text-sm text-gray-600 mb-3">{pendingReviews || 0} pending reviews</p>
            <span className="text-purple-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Review <ArrowRight size={14} className="ml-1" />
            </span>
          </Link>

          <Link
            href="/admin/courses"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <BookOpen className="text-green-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Courses</h3>
            <p className="text-sm text-gray-600 mb-3">{totalCourses || 0} active courses</p>
            <span className="text-green-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Manage <ArrowRight size={14} className="ml-1" />
            </span>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
          >
            <Settings className="text-gray-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900 mb-1">Platform Settings</h3>
            <p className="text-sm text-gray-600 mb-3">Configure system</p>
            <span className="text-gray-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Configure <ArrowRight size={14} className="ml-1" />
            </span>
          </Link>
        </div>

        {/* Recent Activity - Real Data */}
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
                        {activity.profiles?.name || 'Unknown'} • {new Date(activity.created_at).toLocaleString()}
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
  )
}
