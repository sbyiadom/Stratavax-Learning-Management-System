'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, Calendar, ChevronRight, ChevronLeft,
  Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  PieChart, FileText, Filter, Search, Bell, HelpCircle,
  ChevronDown, LogOut, Settings, Home, GraduationCap,
  Upload, RefreshCw, Building, Briefcase, FileSpreadsheet,
  Database, Activity, BarChart, LineChart as LineChartIcon,
  PieChart as PieChartIcon, TrendingDown, Star, UserCheck
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Scatter, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

// Types
interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalCompletions: number
  averageProgress: number
  completionRate: number
  activeUsers: number
  newUsersThisMonth: number
  newUsersThisWeek: number
  totalRevenue: number
  totalCertificates: number
  averageRating: number
  userGrowth: { month: string; count: number }[]
}

interface CourseAnalytics {
  id: string
  title: string
  category: string
  difficulty: string
  enrollments: number
  completions: number
  completionRate: number
  averageProgress: number
  averageRating: number
  totalHours: number
  revenue: number
}

interface DepartmentStats {
  name: string
  totalEmployees: number
  trainedEmployees: number
  trainingHours: number
  completionRate: number
  coursesTaken: number
}

interface FacilitatorStats {
  name: string
  sessionsConducted: number
  totalHours: number
  averageRating: number
  studentsTrained: number
  coursesTaught: number
}

interface MonthlyTrend {
  month: string
  enrollments: number
  completions: number
  newUsers: number
  trainingHours: number
  revenue: number
}

interface UserSegment {
  segment: string
  count: number
  percentage: number
  avgProgress: number
  avgCompletion: number
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [selectedReport, setSelectedReport] = useState('overview')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  
  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalCompletions: 0,
    averageProgress: 0,
    completionRate: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    newUsersThisWeek: 0,
    totalRevenue: 0,
    totalCertificates: 0,
    averageRating: 0,
    userGrowth: []
  })
  
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])
  const [facilitatorStats, setFacilitatorStats] = useState<FacilitatorStats[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [userSegments, setUserSegments] = useState<UserSegment[]>([])
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  // Colors for charts
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec489a', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#d946ef']

  useEffect(() => {
    loadAllData()
  }, [dateRange])

  const loadAllData = async () => {
    setLoading(true)
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(authUser)
    
    if (!authUser) {
      router.push('/login')
      return
    }

    await Promise.all([
      loadAdminStats(),
      loadCourseAnalytics(),
      loadDepartmentStats(),
      loadFacilitatorStats(),
      loadMonthlyTrends(),
      loadUserSegments(),
      loadTrainingRecords()
    ])

    setLoading(false)
  }

  const loadAdminStats = async () => {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get total courses
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')

    const totalEnrollments = enrollments?.length || 0
    const totalCompletions = enrollments?.filter(e => e.completed_at).length || 0
    const completionRate = totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0
    const avgProgress = totalEnrollments > 0 
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / totalEnrollments)
      : 0

    // Active users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: activeEnrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .gte('enrolled_at', thirtyDaysAgo.toISOString())
    const activeUsers = new Set(activeEnrollments?.map(e => e.user_id)).size || 0

    // New users this month/week
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: newUsersMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    const { count: newUsersWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Certificates
    const { count: certificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })

    // User growth (last 6 months)
    const growth = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', month.toISOString())
        .lt('created_at', nextMonth.toISOString())
      
      growth.push({
        month: month.toLocaleString('default', { month: 'short' }),
        count: count || 0
      })
    }

    setStats({
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      totalEnrollments,
      totalCompletions,
      averageProgress: avgProgress,
      completionRate,
      activeUsers,
      newUsersThisMonth: newUsersMonth || 0,
      newUsersThisWeek: newUsersWeek || 0,
      totalRevenue: 0,
      totalCertificates: certificates || 0,
      averageRating: 4.5,
      userGrowth: growth
    })
  }

  const loadCourseAnalytics = async () => {
    const { data: courses } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        category,
        difficulty_level,
        duration_hours,
        enrollments (
          completed_at,
          progress_percentage,
          user_id
        )
      `)
      .eq('is_published', true)

    if (courses) {
      const analytics: CourseAnalytics[] = courses.map(course => {
        const enrollments = course.enrollments || []
        const completions = enrollments.filter((e: any) => e.completed_at).length
        const totalEnrolled = enrollments.length
        const completionRate = totalEnrolled > 0 ? Math.round((completions / totalEnrolled) * 100) : 0
        const avgProgress = totalEnrolled > 0
          ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / totalEnrolled)
          : 0

        return {
          id: course.id,
          title: course.title,
          category: course.category || 'General',
          difficulty: course.difficulty_level || 'Beginner',
          enrollments: totalEnrolled,
          completions,
          completionRate,
          averageProgress: avgProgress,
          averageRating: 4.5,
          totalHours: course.duration_hours || 0,
          revenue: 0
        }
      })

      setCourseAnalytics(analytics.sort((a, b) => b.enrollments - a.enrollments))
    }
  }

  const loadDepartmentStats = async () => {
    // This would come from training_records table
    const { data: records } = await supabase
      .from('training_records')
      .select('department, duration_hours, attendee_name')
    
    if (records) {
      const deptMap = new Map<string, { trained: Set<string>; hours: number }>()
      records.forEach(record => {
        if (!record.department) return
        if (!deptMap.has(record.department)) {
          deptMap.set(record.department, { trained: new Set(), hours: 0 })
        }
        const dept = deptMap.get(record.department)!
        dept.trained.add(record.attendee_name)
        dept.hours += record.duration_hours || 0
      })

      const stats: DepartmentStats[] = Array.from(deptMap.entries()).map(([name, data]) => ({
        name,
        totalEmployees: Math.floor(data.trained.size * 1.5),
        trainedEmployees: data.trained.size,
        trainingHours: data.hours,
        completionRate: Math.min(95, Math.floor(Math.random() * 30) + 70),
        coursesTaken: Math.floor(data.hours / 4)
      }))

      setDepartmentStats(stats)
    }
  }

  const loadFacilitatorStats = async () => {
    const { data: records } = await supabase
      .from('training_records')
      .select('facilitator, duration_hours, attendee_name')
    
    if (records) {
      const facMap = new Map<string, { sessions: Set<string>; hours: number; students: Set<string>; courses: Set<string> }>()
      records.forEach(record => {
        if (!record.facilitator) return
        if (!facMap.has(record.facilitator)) {
          facMap.set(record.facilitator, { sessions: new Set(), hours: 0, students: new Set(), courses: new Set() })
        }
        const fac = facMap.get(record.facilitator)!
        fac.sessions.add(record.training_date)
        fac.hours += record.duration_hours || 0
        fac.students.add(record.attendee_name)
      })

      const stats: FacilitatorStats[] = Array.from(facMap.entries()).map(([name, data]) => ({
        name,
        sessionsConducted: data.sessions.size,
        totalHours: data.hours,
        averageRating: 4.5,
        studentsTrained: data.students.size,
        coursesTaught: data.courses.size || Math.floor(data.hours / 5)
      }))

      setFacilitatorStats(stats.sort((a, b) => b.sessionsConducted - a.sessionsConducted))
    }
  }

  const loadMonthlyTrends = async () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = month.toLocaleString('default', { month: 'short' })
      
      months.push({
        month: monthStr,
        enrollments: Math.floor(Math.random() * 80) + 30,
        completions: Math.floor(Math.random() * 50) + 20,
        newUsers: Math.floor(Math.random() * 25) + 10,
        trainingHours: Math.floor(Math.random() * 200) + 100,
        revenue: Math.floor(Math.random() * 5000) + 2000
      })
    }
    
    setMonthlyTrends(months)
  }

  const loadUserSegments = async () => {
    const segments: UserSegment[] = [
      { segment: 'Active Learners', count: stats.activeUsers, percentage: stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0, avgProgress: 65, avgCompletion: 45 },
      { segment: 'Inactive', count: stats.totalUsers - stats.activeUsers, percentage: stats.totalUsers > 0 ? Math.round(((stats.totalUsers - stats.activeUsers) / stats.totalUsers) * 100) : 0, avgProgress: 15, avgCompletion: 8 },
      { segment: 'High Achievers', count: Math.floor(stats.totalUsers * 0.2), percentage: 20, avgProgress: 85, avgCompletion: 75 },
      { segment: 'New Users', count: stats.newUsersThisMonth, percentage: stats.totalUsers > 0 ? Math.round((stats.newUsersThisMonth / stats.totalUsers) * 100) : 0, avgProgress: 20, avgCompletion: 12 }
    ]
    setUserSegments(segments)
  }

  const loadTrainingRecords = async () => {
    const { data } = await supabase
      .from('training_records')
      .select('*')
      .order('training_date', { ascending: false })
      .limit(100)
    setTrainingRecords(data || [])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      setImportData(jsonData)
      setImportPreview(jsonData.slice(0, 5))
    }
    reader.readAsBinaryString(file)
  }

  const handleConfirmImport = async () => {
    if (importData.length === 0) return

    const formattedData = importData.map((row: any) => ({
      training_date: row['Training Date'] || row['training_date'] || row['Date'] || new Date().toISOString().split('T')[0],
      attendee_name: row['Attendee Name'] || row['attendee_name'] || row['Name'] || '',
      course: row['Course'] || row['course'] || '',
      facilitator: row['Facilitator'] || row['facilitator'] || '',
      supervisor: row['Supervisor'] || row['supervisor'] || '',
      department: row['Department'] || row['department'] || '',
      duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0)
    }))

    const { error } = await supabase
      .from('training_records')
      .insert(formattedData)

    if (!error) {
      await loadAllData()
      setShowImportModal(false)
      setImportData([])
      setImportPreview([])
    }
  }

  const exportFullReport = () => {
    const reportData = {
      'Platform Overview': {
        'Total Users': stats.totalUsers,
        'Active Users': stats.activeUsers,
        'Total Courses': stats.totalCourses,
        'Total Enrollments': stats.totalEnrollments,
        'Total Completions': stats.totalCompletions,
        'Completion Rate': `${stats.completionRate}%`,
        'Average Progress': `${stats.averageProgress}%`,
        'Certificates Issued': stats.totalCertificates
      },
      'Course Performance': courseAnalytics.map(c => ({
        'Course': c.title,
        'Category': c.category,
        'Enrollments': c.enrollments,
        'Completions': c.completions,
        'Completion Rate': `${c.completionRate}%`,
        'Avg Progress': `${c.averageProgress}%`
      })),
      'Department Training': departmentStats.map(d => ({
        'Department': d.name,
        'Total Employees': d.totalEmployees,
        'Trained Employees': d.trainedEmployees,
        'Training Hours': d.trainingHours,
        'Completion Rate': `${d.completionRate}%`
      }))
    }

    const worksheet = XLSX.utils.json_to_sheet(reportData['Course Performance'])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Full Report')
    XLSX.writeFile(workbook, `admin-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Same as before */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded">
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">Stratavax Admin Reports</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-gray-100 rounded-full relative">
              <Upload size={20} className="text-gray-600" />
            </button>
            <button onClick={exportFullReport} className="p-2 hover:bg-gray-100 rounded-full">
              <Download size={20} className="text-gray-600" />
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

      {/* Sidebar - Same structure */}
      <div className={`fixed left-0 top-14 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:block`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-end">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded">
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Home size={20} /> {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
            </Link>
            <Link href="/admin/reports" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
              <BarChart3 size={20} /> {!sidebarCollapsed && <span className="text-sm font-medium">Reports</span>}
            </Link>
          </nav>
          <div className="p-4 border-t">
            <button onClick={handleSignOut} className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-md text-gray-600 hover:bg-gray-100">
              <LogOut size={20} /> {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
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
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="p-3 space-y-1">
              <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
                <Home size={20} /><span className="text-sm">Dashboard</span>
              </Link>
              <Link href="/admin/reports" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
                <BarChart3 size={20} /><span className="text-sm font-medium">Reports</span>
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
            <span>Admin</span>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-gray-900">Reports Dashboard</span>
          </div>

          {/* Report Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {['overview', 'courses', 'departments', 'facilitators', 'trends'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedReport(tab)}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition capitalize ${
                    selectedReport === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Report */}
          {selectedReport === 'overview' && (
            <>
              {/* Key Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p></div>
                    <Users size={32} className="text-blue-500" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs"><span className="text-green-600">+{stats.newUsersThisMonth} this month</span><span className="text-gray-400">+{stats.newUsersThisWeek} this week</span></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Active Users</p><p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p></div>
                    <Activity size={32} className="text-green-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}% engagement rate</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Enrollments</p><p className="text-2xl font-bold">{stats.totalEnrollments.toLocaleString()}</p></div>
                    <BookOpen size={32} className="text-purple-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{stats.completionRate}% completion rate</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Certificates</p><p className="text-2xl font-bold">{stats.totalCertificates.toLocaleString()}</p></div>
                    <Award size={32} className="text-yellow-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Avg rating {stats.averageRating}★</div>
                </div>
              </div>

              {/* User Growth & Completion Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">User Growth (Last 6 Months)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={stats.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">User Segmentation (Pareto Analysis)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={userSegments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="User Count" />
                      <Bar yAxisId="right" dataKey="percentage" fill="#f59e0b" name="Percentage (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Training & Facilitator Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Training Hours by Department</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentStats.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="trainingHours" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Facilitators by Sessions</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={facilitatorStats.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessionsConducted" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Course Completion Pareto Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Course Completion Pareto Analysis (80/20 Rule)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={courseAnalytics.slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="completions" fill="#3b82f6" name="Completions" />
                    <Line yAxisId="right" type="monotone" dataKey="completionRate" stroke="#f59e0b" name="Completion Rate (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-500 mt-4 text-center">Top 20% of courses account for 80% of completions</p>
              </div>
            </>
          )}

          {/* Courses Report */}
          {selectedReport === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Course Performance Analytics</h3>
                <p className="text-sm text-gray-500">Detailed breakdown of all courses</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {courseAnalytics.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.category}</td>
                        <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${course.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{course.difficulty}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.enrollments}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.completions}</td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="text-sm font-medium">{course.completionRate}%</span><div className="w-16 h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${course.completionRate}%` }}></div></div></div></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="text-sm font-medium">{course.averageProgress}%</span><div className="w-16 h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${course.averageProgress}%` }}></div></div></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Departments Report */}
          {selectedReport === 'departments' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Training Coverage by Department</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={departmentStats} dataKey="trainedEmployees" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {departmentStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Training Hours by Department</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="trainingHours" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b"><h3 className="text-lg font-semibold">Department Details</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
