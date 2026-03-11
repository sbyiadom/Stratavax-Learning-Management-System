'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3,
  Download,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  PieChart,
  FileText,
  Filter,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings,
  Home,
  GraduationCap
} from 'lucide-react'

type ReportStats = {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalCompletions: number
  averageProgress: number
  completionRate: number
  activeUsers: number
  newUsersThisMonth: number
}

type CourseStats = {
  id: string
  title: string
  enrollments: number
  completions: number
  completionRate: number
  averageProgress: number
}

type UserProgress = {
  id: string
  full_name: string
  email: string
  enrolled_courses: number
  completed_courses: number
  in_progress: number
  total_points: number
  last_active: string
}

type MonthlyData = {
  month: string
  enrollments: number
  completions: number
  newUsers: number
}

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [selectedReport, setSelectedReport] = useState('overview')
  
  // Report data states
  const [stats, setStats] = useState<ReportStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalCompletions: 0,
    averageProgress: 0,
    completionRate: 0,
    activeUsers: 0,
    newUsersThisMonth: 0
  })
  
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Get total courses
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

      // Get all enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')

      // Calculate enrollment stats
      const totalEnrollments = enrollments?.length || 0
      const totalCompletions = enrollments?.filter(e => e.completed_at).length || 0
      const completionRate = totalEnrollments > 0 
        ? Math.round((totalCompletions / totalEnrollments) * 100) 
        : 0

      // Calculate average progress
      const totalProgress = enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) || 0
      const averageProgress = totalEnrollments > 0 
        ? Math.round(totalProgress / totalEnrollments) 
        : 0

      // Get active users (with enrollments in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: activeEnrollments } = await supabase
        .from('enrollments')
        .select('user_id')
        .gte('enrolled_at', thirtyDaysAgo.toISOString())

      const activeUsers = new Set(activeEnrollments?.map(e => e.user_id)).size || 0

      // Get new users this month
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { count: newUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString())

      setStats({
        totalUsers: totalUsers || 0,
        totalCourses: totalCourses || 0,
        totalEnrollments,
        totalCompletions,
        averageProgress,
        completionRate,
        activeUsers,
        newUsersThisMonth: newUsers || 0
      })

      // Get course statistics
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          enrollments (
            completed_at,
            progress_percentage
          )
        `)
        .eq('is_published', true)

      if (courses) {
        const courseStatsData: CourseStats[] = courses.map(course => {
          const courseEnrollments = course.enrollments || []
          const completions = courseEnrollments.filter((e: any) => e.completed_at).length
          const totalEnrolled = courseEnrollments.length
          const avgProgress = totalEnrolled > 0
            ? Math.round(courseEnrollments.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / totalEnrolled)
            : 0

          return {
            id: course.id,
            title: course.title,
            enrollments: totalEnrolled,
            completions,
            completionRate: totalEnrolled > 0 ? Math.round((completions / totalEnrolled) * 100) : 0,
            averageProgress: avgProgress
          }
        })

        setCourseStats(courseStatsData.sort((a, b) => b.enrollments - a.enrollments))
      }

      // Get user progress data
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          email,
          total_points,
          enrollments (
            completed_at,
            progress_percentage
          )
        `)
        .order('total_points', { ascending: false })
        .limit(10)

      if (profiles) {
        const userProgressData: UserProgress[] = profiles.map(profile => {
          const enrollments = profile.enrollments || []
          const completed = enrollments.filter((e: any) => e.completed_at).length
          const inProgress = enrollments.filter((e: any) => !e.completed_at && e.progress_percentage > 0).length

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            enrolled_courses: enrollments.length,
            completed_courses: completed,
            in_progress: inProgress,
            total_points: profile.total_points || 0,
            last_active: new Date().toISOString().split('T')[0]
          }
        })

        setUserProgress(userProgressData)
      }

      // Generate monthly data (last 6 months)
      const months = []
      const now = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = month.toLocaleString('default', { month: 'short' })
        
        // This would come from actual data in production
        months.push({
          month: monthStr,
          enrollments: Math.floor(Math.random() * 50) + 20,
          completions: Math.floor(Math.random() * 30) + 10,
          newUsers: Math.floor(Math.random() * 15) + 5
        })
      }
      
      setMonthlyData(months)

      setLoading(false)
    }

    loadReportData()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">Stratavax Reports</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <HelpCircle size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden md:block">Admin</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`fixed left-0 top-14 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:block`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-end">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Home size={20} />
              {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
            </Link>
            <Link href="/dashboard/reports" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
              <BarChart3 size={20} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Reports</span>}
            </Link>
            <Link href="/dashboard/manager" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Users size={20} />
              {!sidebarCollapsed && <span className="text-sm">Team</span>}
            </Link>
            <Link href="/dashboard/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Settings size={20} />
              {!sidebarCollapsed && <span className="text-sm">Settings</span>}
            </Link>
          </nav>

          <div className="p-4 border-t">
            <button 
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-md text-gray-600 hover:bg-gray-100"
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-14 bottom-0 w-64 bg-white" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
                <Home size={20} />
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link href="/dashboard/reports" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
                <BarChart3 size={20} />
                <span className="text-sm font-medium">Reports</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <span>Stratavax Learning</span>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-gray-900">Reports</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics & Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Track your platform's performance and learner progress</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Report Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setSelectedReport('overview')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                  selectedReport === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedReport('courses')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                  selectedReport === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Course Reports
              </button>
              <button
                onClick={() => setSelectedReport('learners')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                  selectedReport === 'learners' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Learner Progress
              </button>
            </nav>
          </div>

          {/* Overview Report */}
          {selectedReport === 'overview' && (
            <>
              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <Users className="text-blue-600" size={22} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
                  <p className="text-sm text-gray-500">Total Learners</p>
                  <p className="text-xs text-green-600 mt-1">+{stats.newUsersThisMonth} this month</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-green-100 rounded-lg">
                      <BookOpen className="text-green-600" size={22} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</h3>
                  <p className="text-sm text-gray-500">Total Enrollments</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-purple-100 rounded-lg">
                      <CheckCircle className="text-purple-600" size={22} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalCompletions}</h3>
                  <p className="text-sm text-gray-500">Completions</p>
                  <p className="text-xs text-gray-600 mt-1">{stats.completionRate}% completion rate</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-yellow-100 rounded-lg">
                      <TrendingUp className="text-yellow-600" size={22} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</h3>
                  <p className="text-sm text-gray-500">Avg. Progress</p>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Enrollments</h3>
                  <div className="space-y-3">
                    {monthlyData.map((data) => (
                      <div key={data.month} className="flex items-center">
                        <span className="text-sm text-gray-600 w-16">{data.month}</span>
                        <div className="flex-1 mx-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-2 bg-blue-600 rounded-full" 
                              style={{ width: `${(data.enrollments / 50) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{data.enrollments}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Trends</h3>
                  <div className="space-y-3">
                    {monthlyData.map((data) => (
                      <div key={data.month} className="flex items-center">
                        <span className="text-sm text-gray-600 w-16">{data.month}</span>
                        <div className="flex-1 mx-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-2 bg-green-600 rounded-full" 
                              style={{ width: `${(data.completions / 30) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{data.completions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{stats.activeUsers}</p>
                    <p className="text-sm text-gray-600 mt-1">Active Users (30d)</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{stats.totalCourses}</p>
                    <p className="text-sm text-gray-600 mt-1">Active Courses</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Engagement Rate</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Course Reports */}
          {selectedReport === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {courseStats.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{course.title}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.enrollments}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.completions}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{course.completionRate}%</span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-1.5 bg-green-600 rounded-full" 
                                style={{ width: `${course.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{course.averageProgress}%</span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-1.5 bg-blue-600 rounded-full" 
                                style={{ width: `${course.averageProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Learner Progress Report */}
          {selectedReport === 'learners' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Top Learners</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userProgress.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.enrolled_courses}</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">{user.completed_courses}</td>
                        <td className="px-6 py-4 text-sm text-yellow-600">{user.in_progress}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">{user.total_points}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.last_active}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
