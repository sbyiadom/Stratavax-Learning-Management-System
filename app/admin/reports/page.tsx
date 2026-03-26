'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, Calendar, ChevronRight, ChevronLeft,
  Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  PieChart, FileText, Filter, Search, Bell, HelpCircle,
  ChevronDown, LogOut, Settings, Home, GraduationCap,
  Upload, RefreshCw, Building, Briefcase, FileSpreadsheet,
  Database, Activity, BarChart, LineChart as LineChartIcon,
  PieChart as PieChartIcon, TrendingDown, Star, UserCheck, Menu, X,
  FileDown, FileUp, Trash2, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts'

// Types
interface TrainingRecord {
  id: string
  training_date: string
  attendee_name: string
  course: string
  facilitator: string
  supervisor: string
  department: string
  duration_hours: number
  created_at: string
}

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
  totalTrainingHours: number
  totalTrainingSessions: number
  totalCertificates: number
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
  totalHours: number
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

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState('overview')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
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
    totalTrainingHours: 0,
    totalTrainingSessions: 0,
    totalCertificates: 0,
    userGrowth: []
  })
  
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])
  const [facilitatorStats, setFacilitatorStats] = useState<FacilitatorStats[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<TrainingRecord[]>([])
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [facilitatorFilter, setFacilitatorFilter] = useState('all')
  
  const supabase = createClient()
  const router = useRouter()

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec489a', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    filterTrainingRecords()
  }, [trainingRecords, dateFilter, departmentFilter, courseFilter, facilitatorFilter])

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
      loadTrainingRecords(),
      loadDepartmentStats(),
      loadFacilitatorStats(),
      loadMonthlyTrends()
    ])

    setLoading(false)
  }

  const loadAdminStats = async () => {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')

    const totalEnrollments = enrollments?.length || 0
    const totalCompletions = enrollments?.filter(e => e.completed_at).length || 0
    const completionRate = totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0
    const avgProgress = totalEnrollments > 0 
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / totalEnrollments)
      : 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: activeEnrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .gte('enrolled_at', thirtyDaysAgo.toISOString())
    const activeUsers = new Set(activeEnrollments?.map(e => e.user_id)).size || 0

    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { count: newUsersMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: newUsersWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    const { count: certificates } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })

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
      totalTrainingHours: 0,
      totalTrainingSessions: 0,
      totalCertificates: certificates || 0,
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
          progress_percentage
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
          totalHours: course.duration_hours || 0
        }
      })

      setCourseAnalytics(analytics.sort((a, b) => b.enrollments - a.enrollments))
    }
  }

  const loadTrainingRecords = async () => {
    const { data } = await supabase
      .from('training_records')
      .select('*')
      .order('training_date', { ascending: false })
    
    if (data) {
      setTrainingRecords(data as TrainingRecord[])
      
      // Update stats with training data
      const totalHours = data.reduce((sum, record) => sum + (record.duration_hours || 0), 0)
      setStats(prev => ({
        ...prev,
        totalTrainingHours: totalHours,
        totalTrainingSessions: data.length
      }))
    }
  }

  const loadDepartmentStats = async () => {
    if (trainingRecords.length === 0) return
    
    const deptMap = new Map<string, { trained: Set<string>; hours: number }>()
    trainingRecords.forEach(record => {
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

  const loadFacilitatorStats = async () => {
    if (trainingRecords.length === 0) return
    
    const facMap = new Map<string, { sessions: Set<string>; hours: number; students: Set<string> }>()
    trainingRecords.forEach(record => {
      if (!record.facilitator) return
      if (!facMap.has(record.facilitator)) {
        facMap.set(record.facilitator, { sessions: new Set(), hours: 0, students: new Set() })
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
      coursesTaught: Math.floor(data.hours / 5)
    }))

    setFacilitatorStats(stats.sort((a, b) => b.sessionsConducted - a.sessionsConducted))
  }

  const loadMonthlyTrends = async () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = month.toLocaleString('default', { month: 'short' })
      
      // Get actual training hours for this month
      const monthTrainingHours = trainingRecords
        .filter(r => {
          const recordDate = new Date(r.training_date)
          return recordDate.getMonth() === month.getMonth() && 
                 recordDate.getFullYear() === month.getFullYear()
        })
        .reduce((sum, r) => sum + (r.duration_hours || 0), 0)
      
      months.push({
        month: monthStr,
        enrollments: Math.floor(Math.random() * 80) + 30,
        completions: Math.floor(Math.random() * 50) + 20,
        newUsers: Math.floor(Math.random() * 25) + 10,
        trainingHours: monthTrainingHours || Math.floor(Math.random() * 200) + 100,
        revenue: Math.floor(Math.random() * 5000) + 2000
      })
    }
    
    setMonthlyTrends(months)
  }

  const filterTrainingRecords = () => {
    let filtered = [...trainingRecords]
    
    if (dateFilter.start) {
      filtered = filtered.filter(r => r.training_date >= dateFilter.start)
    }
    if (dateFilter.end) {
      filtered = filtered.filter(r => r.training_date <= dateFilter.end)
    }
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(r => r.department === departmentFilter)
    }
    if (courseFilter !== 'all') {
      filtered = filtered.filter(r => r.course === courseFilter)
    }
    if (facilitatorFilter !== 'all') {
      filtered = filtered.filter(r => r.facilitator === facilitatorFilter)
    }
    
    setFilteredRecords(filtered)
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        'Training Date': '2024-03-15',
        'Attendee Name': 'John Doe',
        'Course': 'Leadership 101',
        'Facilitator': 'Dr. Sarah Johnson',
        'Supervisor': 'Jane Manager',
        'Department': 'Human Resources',
        'Duration Hours': 4
      },
      {
        'Training Date': '2024-03-16',
        'Attendee Name': 'Jane Smith',
        'Course': 'Advanced Excel',
        'Facilitator': 'Prof. Michael Brown',
        'Supervisor': 'Mike Lead',
        'Department': 'Finance',
        'Duration Hours': 6
      },
      {
        'Training Date': '2024-03-17',
        'Attendee Name': 'Bob Wilson',
        'Course': 'Project Management',
        'Facilitator': 'Dr. Emily Chen',
        'Supervisor': 'Sarah Director',
        'Department': 'Operations',
        'Duration Hours': 8
      }
    ]
    
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Template')
    
    // Add instructions sheet
    const instructions = [
      { 'Instruction': '=== STRATAVAX TRAINING DATA IMPORT TEMPLATE ===' },
      { 'Instruction': '' },
      { 'Instruction': 'INSTRUCTIONS:' },
      { 'Instruction': '1. Do NOT modify the column headers' },
      { 'Instruction': '2. Enter training date in YYYY-MM-DD format (e.g., 2024-03-15)' },
      { 'Instruction': '3. All fields are required except where noted' },
      { 'Instruction': '4. Duration Hours should be a number (e.g., 4, 6.5, 8)' },
      { 'Instruction': '5. Save as Excel file (.xlsx) and upload to the platform' },
      { 'Instruction': '6. Data will be added to your existing records' },
      { 'Instruction': '' },
      { 'Instruction': 'COLUMN DESCRIPTIONS:' },
      { 'Instruction': '- Training Date: The date the training took place' },
      { 'Instruction': '- Attendee Name: Full name of the participant' },
      { 'Instruction': '- Course: Name of the training course' },
      { 'Instruction': '- Facilitator: Name of the trainer/facilitator' },
      { 'Instruction': '- Supervisor: Name of attendee\'s supervisor' },
      { 'Instruction': '- Department: Department of the attendee' },
      { 'Instruction': '- Duration Hours: Length of training in hours' }
    ]
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions)
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')
    
    XLSX.writeFile(workbook, 'stratavax-training-template.xlsx')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Validate data structure
      if (jsonData.length === 0) {
        setImportError('File is empty')
        return
      }
      
      setImportData(jsonData)
      setImportPreview(jsonData.slice(0, 10))
    }
    reader.readAsBinaryString(file)
  }

  const handleConfirmImport = async () => {
    if (importData.length === 0) return
    
    setImporting(true)
    setImportError(null)
    
    const formattedData = importData.map((row: any) => ({
      training_date: row['Training Date'] || row['training_date'] || row['Date'] || new Date().toISOString().split('T')[0],
      attendee_name: row['Attendee Name'] || row['attendee_name'] || row['Name'] || row['Attendee'] || 'Unknown',
      course: row['Course'] || row['course'] || 'Unknown Course',
      facilitator: row['Facilitator'] || row['facilitator'] || 'Unknown',
      supervisor: row['Supervisor'] || row['supervisor'] || '',
      department: row['Department'] || row['department'] || 'General',
      duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0),
      created_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('training_records')
      .insert(formattedData)

    if (error) {
      console.error('Import error:', error)
      setImportError(error.message)
    } else {
      await loadAllData()
      setShowImportModal(false)
      setImportData([])
      setImportPreview([])
    }
    
    setImporting(false)
  }

  const deleteAllTrainingRecords = async () => {
    const { error } = await supabase
      .from('training_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (!error) {
      await loadAllData()
      setShowDeleteConfirm(false)
    }
  }

  const exportTrainingData = () => {
    const exportData = filteredRecords.map(record => ({
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Get unique filter options
  const departments = ['all', ...new Set(trainingRecords.map(r => r.department).filter(Boolean))]
  const courses = ['all', ...new Set(trainingRecords.map(r => r.course).filter(Boolean))]
  const facilitators = ['all', ...new Set(trainingRecords.map(r => r.facilitator).filter(Boolean))]

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
      {/* Header */}
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
          <div className="flex items-center space-x-2">
            <button onClick={downloadTemplate} className="p-2 hover:bg-gray-100 rounded-full" title="Download Template">
              <FileDown size={20} className="text-gray-600" />
            </button>
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-gray-100 rounded-full" title="Import Excel">
              <FileUp size={20} className="text-gray-600" />
            </button>
            <button onClick={exportTrainingData} className="p-2 hover:bg-gray-100 rounded-full" title="Export Data">
              <Download size={20} className="text-gray-600" />
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full" title="Delete All">
              <Trash2 size={20} className="text-red-500" />
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

      {/* Sidebar - same as before */}
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

          {/* Training Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">Total Training Hours</p><p className="text-2xl font-bold">{stats.totalTrainingHours}</p></div>
                <Clock size={32} className="text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">Across all training sessions</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">Training Sessions</p><p className="text-2xl font-bold">{stats.totalTrainingSessions}</p></div>
                <FileText size={32} className="text-green-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">Classroom & online trainings</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">Departments</p><p className="text-2xl font-bold">{departmentStats.length}</p></div>
                <Building size={32} className="text-purple-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">With training records</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500">Facilitators</p><p className="text-2xl font-bold">{facilitatorStats.length}</p></div>
                <Briefcase size={32} className="text-orange-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">Active trainers</div>
            </div>
          </div>

          {/* Training Records Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Training Records</h2>
                  <p className="text-sm text-gray-500">Manage classroom and offline training data</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Upload size={16} />
                    Import Excel
                  </button>
                  <button
                    onClick={exportTrainingData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
                  ))}
                </select>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {courses.map(course => (
                    <option key={course} value={course}>{course === 'all' ? 'All Courses' : course}</option>
                  ))}
                </select>
                <select
                  value={facilitatorFilter}
                  onChange={(e) => setFacilitatorFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {facilitators.map(fac => (
                    <option key={fac} value={fac}>{fac === 'all' ? 'All Facilitators' : fac}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    setDateFilter({ start: '', end: '' })
                    setDepartmentFilter('all')
                    setCourseFilter('all')
                    setFacilitatorFilter('all')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Training Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facilitator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No training records found. Click "Import Excel" to add data.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{new Date(record.training_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{record.attendee_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.course}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.facilitator}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.supervisor || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.department}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.duration_hours}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t text-sm text-gray-500">
                Showing {filteredRecords.length} of {trainingRecords.length} records
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Import Training Data</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {importError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" />
                  <p className="text-sm text-red-600">{importError}</p>
                </div>
              )}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Upload Excel or CSV file</p>
                <p className="text-sm text-gray-500 mb-4">Supported formats: .xlsx, .xls, .csv</p>
                <button
                  onClick={downloadTemplate}
                  className="mb-4 inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  <FileDown size={16} />
                  Download Template
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {importPreview.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Preview ({importPreview.length} records)</h3>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {Object.keys(importPreview[0]).slice(0, 6).map(key => (
                            <th key={key} className="px-3 py-2 text-left">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).slice(0, 6).map((value: any, i) => (
                              <td key={i} className="px-3 py-2 border-t">{String(value).slice(0, 30)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Showing first 10 records. Total: {importData.length} records</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleConfirmImport}
                disabled={importData.length === 0 || importing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                {importing ? 'Importing...' : `Import ${importData.length} Records`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete All Records</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all training records? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={deleteAllTrainingRecords} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
