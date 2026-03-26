'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, Calendar, ChevronRight, ChevronLeft,
  Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  FileText, Menu, X, Home, LogOut, Upload, RefreshCw,
  Building, Briefcase, FileSpreadsheet, Activity, Star, UserCheck,
  FileDown, FileUp, Trash2, AlertCircle, PieChart as PieChartIcon,
  LineChart as LineChartIcon, BarChart as BarChartIcon
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts'

interface TrainingRecord {
  id: string
  training_date: string
  attendee_name: string
  course: string
  facilitator: string
  supervisor: string
  department: string
  duration_hours: number
}

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  completedCourses: number
  inProgressCourses: number
  notStartedCourses: number
  averageProgress: number
  completionRate: number
  totalTrainingHours: number
  totalTrainingSessions: number
  activeUsers: number
  newUsersThisMonth: number
  certificatesIssued: number
}

interface CourseStat {
  id: string
  title: string
  enrollments: number
  completions: number
  completionRate: number
  averageProgress: number
}

interface MonthlyData {
  month: string
  enrollments: number
  completions: number
  newUsers: number
  trainingHours: number
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    notStartedCourses: 0,
    averageProgress: 0,
    completionRate: 0,
    totalTrainingHours: 0,
    totalTrainingSessions: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    certificatesIssued: 0
  })
  const [courseStats, setCourseStats] = useState<CourseStat[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [departmentData, setDepartmentData] = useState<{ name: string; hours: number; count: number }[]>([])
  const [facilitatorData, setFacilitatorData] = useState<{ name: string; sessions: number; hours: number }[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16']

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await loadAllData()
      setLoading(false)
    }
    init()
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadCourseStats(),
      loadMonthlyTrends(),
      loadDepartmentData(),
      loadFacilitatorData(),
      loadTrainingRecords()
    ])
  }

  const loadDashboardStats = async () => {
    // Get users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get courses
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('progress_percentage, completed_at, user_id')

    const totalEnrollments = enrollments?.length || 0
    const completedCourses = enrollments?.filter(e => e.completed_at).length || 0
    const inProgressCourses = enrollments?.filter(e => !e.completed_at && e.progress_percentage > 0).length || 0
    const notStartedCourses = enrollments?.filter(e => e.progress_percentage === 0).length || 0
    
    const avgProgress = totalEnrollments > 0 
      ? Math.round(enrollments!.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / totalEnrollments)
      : 0
    const completionRate = totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0

    // Active users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = new Set(enrollments?.filter(e => new Date(e.enrolled_at) > thirtyDaysAgo).map(e => e.user_id)).size || 0

    // New users this month
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    // Certificates
    const { count: certificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })

    setStats({
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      totalEnrollments,
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      averageProgress: avgProgress,
      completionRate,
      totalTrainingHours: 0,
      totalTrainingSessions: 0,
      activeUsers,
      newUsersThisMonth: newUsers || 0,
      certificatesIssued: certificates || 0
    })
  }

  const loadCourseStats = async () => {
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
      const stats: CourseStat[] = courses.map(course => {
        const enrollments = course.enrollments || []
        const completions = enrollments.filter((e: any) => e.completed_at).length
        const total = enrollments.length
        const completionRate = total > 0 ? Math.round((completions / total) * 100) : 0
        const avgProgress = total > 0
          ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / total)
          : 0

        return {
          id: course.id,
          title: course.title,
          enrollments: total,
          completions,
          completionRate,
          averageProgress: avgProgress
        }
      })
      setCourseStats(stats.sort((a, b) => b.enrollments - a.enrollments))
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
        trainingHours: 0
      })
    }
    setMonthlyData(months)
  }

  const loadDepartmentData = async () => {
    // Sample data - replace with actual data from training_records
    setDepartmentData([
      { name: 'Engineering', hours: 120, count: 45 },
      { name: 'Sales', hours: 85, count: 32 },
      { name: 'Marketing', hours: 62, count: 28 },
      { name: 'HR', hours: 48, count: 22 },
      { name: 'Finance', hours: 56, count: 24 }
    ])
  }

  const loadFacilitatorData = async () => {
    setFacilitatorData([
      { name: 'Dr. Sarah Johnson', sessions: 12, hours: 48 },
      { name: 'Prof. Michael Chen', sessions: 10, hours: 40 },
      { name: 'Dr. Emily Brown', sessions: 8, hours: 32 },
      { name: 'Prof. David Wilson', sessions: 7, hours: 28 }
    ])
  }

  const loadTrainingRecords = async () => {
    const { data } = await supabase
      .from('training_records')
      .select('*')
      .order('training_date', { ascending: false })
    setTrainingRecords(data || [])
    
    const totalHours = (data || []).reduce((sum, r) => sum + (r.duration_hours || 0), 0)
    setStats(prev => ({
      ...prev,
      totalTrainingHours: totalHours,
      totalTrainingSessions: data?.length || 0
    }))
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
      setShowImportModal(true)
    }
    reader.readAsBinaryString(file)
  }

  const confirmImport = async () => {
    if (importData.length === 0) return
    
    let successCount = 0
    for (const row of importData) {
      const newRecord = {
        training_date: row['Training Date'] || row['training_date'] || new Date().toISOString().split('T')[0],
        attendee_name: row['Attendee Name'] || row['attendee_name'] || row['Name'] || '',
        course: row['Course'] || row['course'] || '',
        facilitator: row['Facilitator'] || row['facilitator'] || '',
        supervisor: row['Supervisor'] || row['supervisor'] || '',
        department: row['Department'] || row['department'] || '',
        duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0)
      }
      const { error } = await supabase.from('training_records').insert(newRecord)
      if (!error) successCount++
    }
    await loadAllData()
    setShowImportModal(false)
    setImportData([])
    alert(`Imported ${successCount} records`)
  }

  const exportToExcel = () => {
    const exportData = trainingRecords.map(record => ({
      'Training Date': record.training_date,
      'Attendee Name': record.attendee_name,
      'Course': record.course,
      'Facilitator': record.facilitator,
      'Supervisor': record.supervisor,
      'Department': record.department,
      'Duration Hours': record.duration_hours
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Records')
    XLSX.writeFile(workbook, `training-records-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const downloadTemplate = () => {
    const template = [{
      'Training Date': new Date().toISOString().split('T')[0],
      'Attendee Name': 'John Doe',
      'Course': 'Sample Course',
      'Facilitator': 'Dr. Smith',
      'Supervisor': 'Jane Manager',
      'Department': 'HR',
      'Duration Hours': 4
    }]
    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    XLSX.writeFile(workbook, 'training-template.xlsx')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded">
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={18} />
              </div>
              <span className="font-semibold">Stratavax Analytics</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={downloadTemplate} className="p-2 hover:bg-gray-100 rounded" title="Download Template">
              <FileDown size={18} className="text-gray-600" />
            </button>
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-gray-100 rounded" title="Import Excel">
              <FileUp size={18} className="text-gray-600" />
            </button>
            <button onClick={exportToExcel} className="p-2 hover:bg-gray-100 rounded" title="Export Data">
              <Download size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm hidden md:block">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-14 bottom-0 bg-white border-r transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:block`}>
        <div className="p-4 flex justify-end">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded">
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="px-3 space-y-1">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center space-x-3 px-3 py-2 w-full rounded-md ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BarChart3 size={20} /> {!sidebarCollapsed && <span>Overview</span>}
          </button>
          <button onClick={() => setActiveTab('courses')} className={`flex items-center space-x-3 px-3 py-2 w-full rounded-md ${activeTab === 'courses' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen size={20} /> {!sidebarCollapsed && <span>Course Analytics</span>}
          </button>
          <button onClick={() => setActiveTab('training')} className={`flex items-center space-x-3 px-3 py-2 w-full rounded-md ${activeTab === 'training' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileSpreadsheet size={20} /> {!sidebarCollapsed && <span>Training Records</span>}
          </button>
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={handleSignOut} className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
            <LogOut size={20} /> {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-14 bottom-0 w-64 bg-white">
            <div className="p-4 border-b flex justify-between">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="p-3 space-y-1">
              <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
                <BarChart3 size={20} /><span>Overview</span>
              </button>
              <button onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
                <BookOpen size={20} /><span>Course Analytics</span>
              </button>
              <button onClick={() => { setActiveTab('training'); setMobileMenuOpen(false); }} className="flex items-center space-x-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
                <FileSpreadsheet size={20} /><span>Training Records</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p></div>
                    <Users size={32} className="text-blue-500" />
                  </div>
                  <div className="mt-2 text-xs text-green-600">+{stats.newUsersThisMonth} this month</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Active Users</p><p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p></div>
                    <Activity size={32} className="text-green-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}% engagement</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Enrollments</p><p className="text-2xl font-bold">{stats.totalEnrollments.toLocaleString()}</p></div>
                    <BookOpen size={32} className="text-purple-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{stats.completionRate}% completion rate</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Certificates</p><p className="text-2xl font-bold">{stats.certificatesIssued.toLocaleString()}</p></div>
                    <Award size={32} className="text-yellow-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">+{stats.completedCourses} this month</div>
                </div>
              </div>

              {/* Progress Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Course Progress Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Completed</span><span>{stats.completedCourses}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.completedCourses / stats.totalEnrollments) * 100 || 0}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>In Progress</span><span>{stats.inProgressCourses}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.inProgressCourses / stats.totalEnrollments) * 100 || 0}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Not Started</span><span>{stats.notStartedCourses}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gray-400 h-2 rounded-full" style={{ width: `${(stats.notStartedCourses / stats.totalEnrollments) * 100 || 0}%` }}></div></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm"><span>Average Progress</span><span className="font-bold">{stats.averageProgress}%</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Training Hours by Department</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke="#3b82f6" name="Enrollments" />
                    <Line type="monotone" dataKey="completions" stroke="#10b981" name="Completions" />
                    <Line type="monotone" dataKey="newUsers" stroke="#f59e0b" name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Facilitator Performance */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b"><h3 className="text-lg font-semibold">Top Facilitators</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Facilitator</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Sessions</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hours</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {facilitatorData.map((fac) => (<tr key={fac.name} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">{fac.name}</td><td className="px-6 py-4 text-sm">{fac.sessions}</td><td className="px-6 py-4 text-sm">{fac.hours}</td></tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Course Analytics Tab */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b"><h2 className="text-xl font-bold">Course Performance</h2><p className="text-sm text-gray-500">Enrollments, completions, and progress rates</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Course</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Enrollments</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Completions</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Completion Rate</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Avg Progress</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {courseStats.map((course) => (<tr key={course.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">{course.title}</td><td className="px-6 py-4 text-sm">{course.enrollments}</td><td className="px-6 py-4 text-sm">{course.completions}</td><td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{course.completionRate}%</span></td><td className="px-6 py-4"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${course.averageProgress}%` }}></div></div></td></tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Training Records Tab */}
          {activeTab === 'training' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div><h2 className="text-xl font-bold">Training Records</h2><p className="text-sm text-gray-500">Total Hours: {stats.totalTrainingHours} | Total Sessions: {stats.totalTrainingSessions}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => setShowImportModal(true)} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Import Excel</button>
                  <button onClick={exportToExcel} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Export</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Attendee</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Course</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Facilitator</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Department</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hours</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {trainingRecords.slice(0, 50).map((record) => (<tr key={record.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm">{new Date(record.training_date).toLocaleDateString()}</td><td className="px-6 py-4 text-sm">{record.attendee_name}</td><td className="px-6 py-4 text-sm">{record.course}</td><td className="px-6 py-4 text-sm">{record.facilitator}</td><td className="px-6 py-4 text-sm">{record.department}</td><td className="px-6 py-4 text-sm">{record.duration_hours}</td></tr>))}
                    {trainingRecords.length === 0 && (<tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No training records. Click "Import Excel" to add data.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b"><h2 className="text-lg font-semibold">Import Excel Data</h2><button onClick={() => setShowImportModal(false)}><X size={20} /></button></div>
            <div className="p-4">
              {importPreview.length > 0 && (<div><p className="text-sm mb-3">Preview of {importData.length} records:</p><div className="overflow-x-auto"><table className="w-full text-sm border"><thead className="bg-gray-50"><tr>{Object.keys(importPreview[0]).slice(0, 5).map(key => (<th key={key} className="px-3 py-2 border">{key}</th>))}</tr></thead><tbody>{importPreview.map((row, idx) => (<tr key={idx}>{Object.values(row).slice(0, 5).map((value: any, i) => (<td key={i} className="px-3 py-2 border">{String(value).slice(0, 30)}</td>))}</tr>))}</tbody></table></div></div>)}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t"><button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-lg">Import {importData.length} Records</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
