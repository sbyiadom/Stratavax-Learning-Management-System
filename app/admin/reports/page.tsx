'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, ChevronRight, ChevronLeft,
  Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  Menu, X, LogOut, Upload,
  Building, FileSpreadsheet, Activity, Star,
  FileDown, FileUp, Trash2, Plus, Edit, ThumbsUp, MessageSquare,
  Filter, Calendar, User, Briefcase, Bookmark, Users2, MapPin, RefreshCw,
  PieChart, Target, Zap, Brain, Globe, Shield, Sparkles,
  TrendingDown, AlertCircle, Info, Maximize2, Minimize2
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart as RePieChart, Pie, Cell, ComposedChart
} from 'recharts'

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [records, setRecords] = useState<any[]>([])
  const [filteredRecords, setFilteredRecords] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [showFullscreenChart, setShowFullscreenChart] = useState<string | null>(null)
  const [evaluationData, setEvaluationData] = useState<any>({
    total: 0,
    averages: {
      content: 0,
      facilitator: 0,
      logistics: 0,
      engagement: 0,
      applicability: 0,
      overall: 0
    },
    wordCloud: [],
    recentEvaluations: [],
    byCourse: [],
    ratingDistribution: {
      content: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      facilitator: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  })
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supervisor: '',
    role: '',
    course: '',
    facilitator: '',
    department: '',
    attendee: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [dateRangePreset, setDateRangePreset] = useState('all')
  
  // Unique filter options
  const [filterOptions, setFilterOptions] = useState({
    supervisors: [] as string[],
    roles: [] as string[],
    courses: [] as string[],
    facilitators: [] as string[],
    departments: [] as string[],
    attendees: [] as string[]
  })
  
  const [stats, setStats] = useState({
    totalHours: 0,
    totalRecords: 0,
    totalDepartments: 0,
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0,
    completionRate: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    certificatesIssued: 0,
    totalEvaluations: 0,
    averageRating: 0,
    monthlyGrowth: 0
  })
  const [courseStats, setCourseStats] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [facilitatorData, setFacilitatorData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [newRecord, setNewRecord] = useState({
    training_date: new Date().toISOString().split('T')[0],
    attendee_name: '',
    role: '',
    course: '',
    facilitator: '',
    supervisor: '',
    department: '',
    duration_hours: 0
  })
  
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Handle tab navigation from URL
  useEffect(() => {
    if (tabParam === 'training') {
      setActiveTab('training')
    } else if (tabParam === 'evaluations') {
      setActiveTab('evaluations')
    } else {
      setActiveTab('overview')
    }
  }, [tabParam])

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

  useEffect(() => {
    applyFilters()
  }, [records, filters])

  const loadAllData = async () => {
    await Promise.all([
      loadTrainingRecords(),
      loadDashboardStats(),
      loadCourseStats(),
      loadMonthlyTrends(),
      loadDepartmentData(),
      loadFacilitatorData(),
      loadEvaluationStats()
    ])
  }

  const loadTrainingRecords = async () => {
    const { data } = await supabase
      .from('training_records')
      .select('*')
      .order('training_date', { ascending: false })
    
    setRecords(data || [])
    const totalHours = (data || []).reduce((sum, r) => sum + (r.duration_hours || 0), 0)
    const departments = new Set((data || []).map(r => r.department).filter(Boolean))
    
    if (data) {
      const supervisors: string[] = []
      const roles: string[] = []
      const courses: string[] = []
      const facilitators: string[] = []
      const departmentsList: string[] = []
      const attendees: string[] = []
      
      const supervisorSet = new Set<string>()
      const roleSet = new Set<string>()
      const courseSet = new Set<string>()
      const facilitatorSet = new Set<string>()
      const departmentSet = new Set<string>()
      const attendeeSet = new Set<string>()
      
      data.forEach(record => {
        if (record.supervisor && !supervisorSet.has(record.supervisor)) {
          supervisorSet.add(record.supervisor)
          supervisors.push(record.supervisor)
        }
        if (record.role && !roleSet.has(record.role)) {
          roleSet.add(record.role)
          roles.push(record.role)
        }
        if (record.course && !courseSet.has(record.course)) {
          courseSet.add(record.course)
          courses.push(record.course)
        }
        if (record.facilitator && !facilitatorSet.has(record.facilitator)) {
          facilitatorSet.add(record.facilitator)
          facilitators.push(record.facilitator)
        }
        if (record.department && !departmentSet.has(record.department)) {
          departmentSet.add(record.department)
          departmentsList.push(record.department)
        }
        if (record.attendee_name && !attendeeSet.has(record.attendee_name)) {
          attendeeSet.add(record.attendee_name)
          attendees.push(record.attendee_name)
        }
      })
      
      supervisors.sort()
      roles.sort()
      courses.sort()
      facilitators.sort()
      departmentsList.sort()
      attendees.sort()
      
      setFilterOptions({
        supervisors,
        roles,
        courses,
        facilitators,
        departments: departmentsList,
        attendees
      })
    }
    
    setStats(prev => ({
      ...prev,
      totalHours: totalHours,
      totalRecords: data?.length || 0,
      totalDepartments: departments.size
    }))
  }

  const applyFilters = () => {
    let filtered = [...records]
    
    if (filters.startDate) {
      filtered = filtered.filter(r => r.training_date >= filters.startDate)
    }
    if (filters.endDate) {
      filtered = filtered.filter(r => r.training_date <= filters.endDate)
    }
    if (filters.supervisor) {
      filtered = filtered.filter(r => r.supervisor === filters.supervisor)
    }
    if (filters.role) {
      filtered = filtered.filter(r => r.role === filters.role)
    }
    if (filters.course) {
      filtered = filtered.filter(r => r.course === filters.course)
    }
    if (filters.facilitator) {
      filtered = filtered.filter(r => r.facilitator === filters.facilitator)
    }
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department)
    }
    if (filters.attendee) {
      filtered = filtered.filter(r => r.attendee_name === filters.attendee)
    }
    
    setFilteredRecords(filtered)
  }

  const setDateRange = (preset: string) => {
    setDateRangePreset(preset)
    const today = new Date()
    let startDate = ''
    
    switch(preset) {
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarterAgo = new Date(today)
        quarterAgo.setMonth(today.getMonth() - 3)
        startDate = quarterAgo.toISOString().split('T')[0]
        break
      default:
        startDate = ''
    }
    
    setFilters({...filters, startDate, endDate: today.toISOString().split('T')[0]})
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      supervisor: '',
      role: '',
      course: '',
      facilitator: '',
      department: '',
      attendee: ''
    })
    setDateRangePreset('all')
  }

  const loadEvaluationStats = async () => {
    try {
      const response = await fetch('/api/training/stats')
      const data = await response.json()
      if (data && data.success) {
        setEvaluationData(data)
        setStats(prev => ({
          ...prev,
          totalEvaluations: data.total || 0,
          averageRating: data.averages?.overall || 0
        }))
      }
    } catch (error) {
      console.error('Error loading evaluation stats:', error)
    }
  }

  const loadDashboardStats = async () => {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true)
    const { data: enrollments } = await supabase.from('enrollments').select('progress_percentage, completed_at, user_id, enrolled_at')
    const { data: previousMonthRecords } = await supabase
      .from('training_records')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())

    const totalEnrollments = enrollments?.length || 0
    const completedCourses = enrollments?.filter(e => e.completed_at).length || 0
    const inProgressCourses = enrollments?.filter(e => !e.completed_at && e.progress_percentage > 0).length || 0
    const avgProgress = totalEnrollments > 0 ? Math.round(enrollments!.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / totalEnrollments) : 0
    const completionRate = totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsersList = enrollments?.filter(e => e.enrolled_at && new Date(e.enrolled_at) > thirtyDaysAgo).map(e => e.user_id) || []
    const uniqueActiveUsers = new Set(activeUsersList).size || 0

    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString())
    const { count: certificates } = await supabase.from('certificates').select('*', { count: 'exact', head: true })

    // Calculate monthly growth
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const { data: lastMonthRecords } = await supabase
      .from('training_records')
      .select('id')
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', firstDayOfMonth.toISOString())
    
    const currentMonthCount = stats.totalRecords
    const lastMonthCount = lastMonthRecords?.length || 0
    const monthlyGrowth = lastMonthCount > 0 ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0

    setStats(prev => ({
      ...prev,
      totalUsers: totalUsers || 0,
      totalCourses: totalCourses || 0,
      totalEnrollments,
      completedCourses,
      inProgressCourses,
      averageProgress: avgProgress,
      completionRate,
      activeUsers: uniqueActiveUsers,
      newUsersThisMonth: newUsers || 0,
      certificatesIssued: certificates || 0,
      monthlyGrowth
    }))
  }

  const loadCourseStats = async () => {
    const { data: courses } = await supabase.from('courses').select('id, title, enrollments (completed_at, progress_percentage)').eq('is_published', true)
    if (courses) {
      const statsList = courses.map((course: any) => {
        const enrollments = course.enrollments || []
        const completions = enrollments.filter((e: any) => e.completed_at).length
        const total = enrollments.length
        const completionRate = total > 0 ? Math.round((completions / total) * 100) : 0
        const avgProgress = total > 0 ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / total) : 0
        return {
          id: course.id,
          title: course.title,
          enrollments: total,
          completions,
          completionRate,
          averageProgress: avgProgress
        }
      })
      setCourseStats(statsList.sort((a, b) => b.enrollments - a.enrollments))
    }
  }

  const loadMonthlyTrends = async () => {
    const { data: enrollments } = await supabase.from('enrollments').select('enrolled_at, completed_at')
    const { data: profiles } = await supabase.from('profiles').select('created_at')
    const { data: trainingRecords } = await supabase.from('training_records').select('training_date, duration_hours')
    const { data: formSubmissions } = await supabase.from('form_submissions').select('created_at')
    
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthStr = month.toLocaleString('default', { month: 'short' })
      
      months.push({
        month: monthStr,
        enrollments: enrollments?.filter(e => e.enrolled_at && new Date(e.enrolled_at) >= month && new Date(e.enrolled_at) < nextMonth).length || 0,
        completions: enrollments?.filter(e => e.completed_at && new Date(e.completed_at) >= month && new Date(e.completed_at) < nextMonth).length || 0,
        newUsers: profiles?.filter(p => p.created_at && new Date(p.created_at) >= month && new Date(p.created_at) < nextMonth).length || 0,
        trainingHours: trainingRecords?.filter(r => r.training_date && new Date(r.training_date) >= month && new Date(r.training_date) < nextMonth).reduce((sum, r) => sum + (r.duration_hours || 0), 0) || 0,
        formSubmissions: formSubmissions?.filter(f => f.created_at && new Date(f.created_at) >= month && new Date(f.created_at) < nextMonth).length || 0
      })
    }
    setMonthlyData(months)
  }

  const loadDepartmentData = async () => {
    const { data: records } = await supabase.from('training_records').select('department, duration_hours')
    if (records && records.length > 0) {
      const deptMap = new Map()
      records.forEach((record: any) => {
        if (!record.department) return
        const existing = deptMap.get(record.department)
        if (existing) {
          deptMap.set(record.department, existing + (record.duration_hours || 0))
        } else {
          deptMap.set(record.department, record.duration_hours || 0)
        }
      })
      setDepartmentData(Array.from(deptMap.entries()).map(([name, hours]) => ({ name, hours })))
    } else {
      setDepartmentData([])
    }
  }

  const loadFacilitatorData = async () => {
    const { data: records } = await supabase.from('training_records').select('facilitator, duration_hours')
    if (records && records.length > 0) {
      const facMap = new Map()
      records.forEach((record: any) => {
        if (!record.facilitator) return
        const existing = facMap.get(record.facilitator)
        if (existing) {
          facMap.set(record.facilitator, existing + (record.duration_hours || 0))
        } else {
          facMap.set(record.facilitator, record.duration_hours || 0)
        }
      })
      setFacilitatorData(Array.from(facMap.entries()).map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours).slice(0, 5))
    } else {
      setFacilitatorData([])
    }
  }

  const handleAddRecord = async () => {
    if (!newRecord.attendee_name || !newRecord.course) {
      alert('Please fill in attendee name and course')
      return
    }

    const recordData = {
      training_date: newRecord.training_date,
      attendee_name: newRecord.attendee_name,
      role: newRecord.role || '',
      course: newRecord.course,
      facilitator: newRecord.facilitator || '',
      supervisor: newRecord.supervisor || '',
      department: newRecord.department || '',
      duration_hours: newRecord.duration_hours || 0,
      source: 'manual'
    }

    const { error } = await supabase.from('training_records').insert(recordData)

    if (!error) {
      await loadAllData()
      setShowAddModal(false)
      setNewRecord({
        training_date: new Date().toISOString().split('T')[0],
        attendee_name: '',
        role: '',
        course: '',
        facilitator: '',
        supervisor: '',
        department: '',
        duration_hours: 0
      })
      alert('Record added successfully')
    } else {
      console.error('Error adding record:', error)
      alert('Error adding record: ' + error.message)
    }
  }

  const handleUpdateRecord = async () => {
    if (!editingRecord) return

    const { error } = await supabase
      .from('training_records')
      .update({
        training_date: editingRecord.training_date,
        attendee_name: editingRecord.attendee_name,
        role: editingRecord.role || '',
        course: editingRecord.course,
        facilitator: editingRecord.facilitator,
        supervisor: editingRecord.supervisor,
        department: editingRecord.department,
        duration_hours: editingRecord.duration_hours
      })
      .eq('id', editingRecord.id)

    if (!error) {
      await loadAllData()
      setEditingRecord(null)
      alert('Record updated successfully')
    } else {
      alert('Error updating record')
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Delete this record? This will also delete any associated evaluations.')) {
      try {
        const { error: evalError } = await supabase
          .from('training_evaluations')
          .delete()
          .eq('training_record_id', id)
        
        const { error: recordError } = await supabase
          .from('training_records')
          .delete()
          .eq('id', id)
        
        if (recordError) {
          alert('Error deleting record: ' + recordError.message)
          return
        }
        
        await supabase
          .from('form_submissions')
          .update({ training_record_id: null })
          .eq('training_record_id', id)
        
        await loadAllData()
        alert('Record deleted successfully')
      } catch (error) {
        console.error('Error in delete operation:', error)
        alert('Error deleting record')
      }
    }
  }

  const downloadTemplate = () => {
    const template = [{
      'Training Date': new Date().toISOString().split('T')[0],
      'Attendee Name': 'John Doe',
      'Role': 'Employee',
      'Course': 'Leadership 101',
      'Facilitator': 'Dr. Johnson',
      'Supervisor': 'Jane Manager',
      'Department': 'HR',
      'Duration Hours': 4
    }]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'training-template.xlsx')
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
    let success = 0
    for (const row of importData) {
      const record = {
        training_date: row['Training Date'] || row['training_date'] || new Date().toISOString().split('T')[0],
        attendee_name: row['Attendee Name'] || row['attendee_name'] || row['Name'] || '',
        role: row['Role'] || row['role'] || '',
        course: row['Course'] || row['course'] || '',
        facilitator: row['Facilitator'] || row['facilitator'] || '',
        supervisor: row['Supervisor'] || row['supervisor'] || '',
        department: row['Department'] || row['department'] || '',
        duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0),
        source: 'manual_import'
      }
      const { error } = await supabase.from('training_records').insert(record)
      if (!error) success++
    }
    await loadAllData()
    setShowImportModal(false)
    setImportData([])
    alert(`Imported ${success} records`)
  }

  const exportToExcel = () => {
    const exportData = filteredRecords.map((r: any) => ({
      'Training Date': r.training_date,
      'Attendee Name': r.attendee_name,
      'Role': r.role || '',
      'Course': r.course,
      'Facilitator': r.facilitator,
      'Supervisor': r.supervisor || '',
      'Department': r.department,
      'Location': r.location || '',
      'Duration Hours': r.duration_hours,
      'Source': r.source || 'manual'
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Training Records')
    XLSX.writeFile(wb, `training-data-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const radarData = [
    { subject: 'Content', rating: evaluationData.averages.content, fullMark: 5 },
    { subject: 'Facilitator', rating: evaluationData.averages.facilitator, fullMark: 5 },
    { subject: 'Logistics', rating: evaluationData.averages.logistics, fullMark: 5 },
    { subject: 'Engagement', rating: evaluationData.averages.engagement, fullMark: 5 },
    { subject: 'Applicability', rating: evaluationData.averages.applicability, fullMark: 5 }
  ]

  // Prepare rating distribution data for pie chart
  const ratingDistributionData = [
    { name: '5 Stars', value: evaluationData.ratingDistribution?.overall?.[5] || 0, color: '#10b981' },
    { name: '4 Stars', value: evaluationData.ratingDistribution?.overall?.[4] || 0, color: '#3b82f6' },
    { name: '3 Stars', value: evaluationData.ratingDistribution?.overall?.[3] || 0, color: '#f59e0b' },
    { name: '2 Stars', value: evaluationData.ratingDistribution?.overall?.[2] || 0, color: '#ef4444' },
    { name: '1 Star', value: evaluationData.ratingDistribution?.overall?.[1] || 0, color: '#6b7280' }
  ].filter(item => item.value > 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navigation user={user} isAdmin={true} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Executive Analytics
                </h1>
                <p className="text-gray-500 mt-1">Comprehensive training intelligence & performance metrics</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
                >
                  <Download size={16} />
                  Export Report
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
                >
                  <Upload size={16} />
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Training Hours</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalHours}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} /> +{stats.monthlyGrowth.toFixed(1)}% from last month
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Clock className="text-blue-600" size={28} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRecords}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.totalDepartments} departments</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <FileSpreadsheet className="text-purple-600" size={28} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Rating</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.averageRating}</p>
                  <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <Star className="text-yellow-600" size={28} fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.completionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.completedCourses} completed courses</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="text-green-600" size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('overview')
                router.push('/admin/reports')
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 size={18} />
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('training')
                router.push('/admin/reports?tab=training')
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition ${
                activeTab === 'training'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet size={18} />
              Training Records
            </button>
            <button
              onClick={() => {
                setActiveTab('evaluations')
                router.push('/admin/reports?tab=evaluations')
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition ${
                activeTab === 'evaluations'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star size={18} />
              Evaluations
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-blue-700">Active Learners</span>
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">of {stats.totalUsers} total users</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-700">Course Engagement</span>
                    <BookOpen className="text-green-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEnrollments}</p>
                  <p className="text-xs text-gray-500 mt-1">total enrollments across {stats.totalCourses} courses</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-700">Certificates Issued</span>
                    <Award className="text-purple-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.certificatesIssued}</p>
                  <p className="text-xs text-gray-500 mt-1">+{stats.completedCourses} this period</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Training Hours by Department</h3>
                    <button 
                      onClick={() => setShowFullscreenChart('department')}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={departmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top Facilitators</h3>
                    <button 
                      onClick={() => setShowFullscreenChart('facilitators')}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={facilitatorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Performance Trends</h3>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Enrollments</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Completions</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Training Hours</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="enrollments" fill="#3b82f6" name="Enrollments" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="completions" fill="#10b981" name="Completions" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="trainingHours" stroke="#f59e0b" name="Training Hours" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Evaluation Insights */}
              {stats.totalEvaluations > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Effectiveness Radar</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <Radar name="Rating" dataKey="rating" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Word Cloud</h3>
                    <div className="flex flex-wrap gap-2 min-h-[250px] items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                      {evaluationData.wordCloud && evaluationData.wordCloud.length > 0 ? (
                        evaluationData.wordCloud.map((item: any, idx: number) => (
                          <span 
                            key={idx} 
                            className="inline-block px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-gray-700 transition-all hover:scale-105 cursor-default shadow-sm"
                            style={{ 
                              fontSize: `${Math.max(12, Math.min(32, 12 + item.count * 4))}px`,
                              fontWeight: item.count > 2 ? '600' : '400'
                            }}
                          >
                            {item.word} <span className="text-xs text-gray-400">({item.count})</span>
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-400">No feedback data yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'training' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {/* Filter Bar */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Training Records</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {filteredRecords.length} records • {stats.totalHours} total hours
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      <button onClick={() => setDateRange('week')} className={`px-3 py-1.5 text-xs rounded-md transition ${dateRangePreset === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Week</button>
                      <button onClick={() => setDateRange('month')} className={`px-3 py-1.5 text-xs rounded-md transition ${dateRangePreset === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Month</button>
                      <button onClick={() => setDateRange('quarter')} className={`px-3 py-1.5 text-xs rounded-md transition ${dateRangePreset === 'quarter' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Quarter</button>
                      <button onClick={() => setDateRange('all')} className={`px-3 py-1.5 text-xs rounded-md transition ${dateRangePreset === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>All</button>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      <Filter size={14} /> Filters
                    </button>
                    <button onClick={clearFilters} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-200 transition">
                      <RefreshCw size={14} /> Clear
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
                      <Plus size={14} /> Add Record
                    </button>
                    <button onClick={() => setShowImportModal(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
                      <Upload size={14} /> Import
                    </button>
                  </div>
                </div>
                
                {/* Filters Panel */}
                {showFilters && (
                  <div className="mt-5 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                      <div className="flex gap-2">
                        <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Attendee</label>
                      <select value={filters.attendee} onChange={(e) => setFilters({...filters, attendee: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All</option>
                        {filterOptions.attendees.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                      <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All</option>
                        {filterOptions.roles.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                      <select value={filters.course} onChange={(e) => setFilters({...filters, course: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All</option>
                        {filterOptions.courses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Facilitator</label>
                      <select value={filters.facilitator} onChange={(e) => setFilters({...filters, facilitator: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All</option>
                        {filterOptions.facilitators.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
                      <select value={filters.supervisor} onChange={(e) => setFilters({...filters, supervisor: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All</option>
                        {filterOptions.supervisors.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                      <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All</option>
                        {filterOptions.departments.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendee</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facilitator</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supervisor</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((record: any) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4 text-sm text-gray-700">{new Date(record.training_date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">{record.attendee_name || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{record.role || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{record.course}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{record.facilitator || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{record.supervisor || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{record.department || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{record.location || '-'}</td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700">{record.duration_hours}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.source === 'google_form' ? 'bg-green-100 text-green-700' : record.source === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {record.source || 'manual'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingRecord(record)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteRecord(record.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-5 py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <FileSpreadsheet size={48} className="text-gray-300" />
                            <p>No training records found</p>
                            <button onClick={() => setShowAddModal(true)} className="mt-2 text-blue-600 text-sm hover:underline">Add your first record</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="space-y-6">
              {/* Evaluation Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-gray-100">
                  <p className="text-sm text-gray-500">Total Evaluations</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{evaluationData.total}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-gray-100">
                  <p className="text-sm text-gray-500">Overall Rating</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{evaluationData.averages.overall}</p>
                  <p className="text-xs text-gray-400">/5.0</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-gray-100">
                  <p className="text-sm text-gray-500">Content Quality</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{evaluationData.averages.content}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-gray-100">
                  <p className="text-sm text-gray-500">Facilitator</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{evaluationData.averages.facilitator}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 text-center border border-gray-100">
                  <p className="text-sm text-gray-500">Engagement</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{evaluationData.averages.engagement}</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RePieChart>
                      <Pie
                        data={ratingDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {ratingDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                    {evaluationData.byCourse && evaluationData.byCourse.slice(0, 5).map((course: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{course.course}</p>
                          <p className="text-xs text-gray-500">{course.total} evaluations</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-gray-700">{course.overall}</span>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(course.overall / 5) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Word Cloud */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud - One Word Feedback</h3>
                <div className="flex flex-wrap gap-2 min-h-[180px] items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                  {evaluationData.wordCloud && evaluationData.wordCloud.length > 0 ? (
                    evaluationData.wordCloud.map((item: any, idx: number) => (
                      <span 
                        key={idx} 
                        className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-gray-700 transition-all hover:scale-105 hover:shadow-md cursor-default"
                        style={{ 
                          fontSize: `${Math.max(12, Math.min(32, 12 + item.count * 3))}px`,
                          fontWeight: item.count > 1 ? '500' : '400'
                        }}
                      >
                        {item.word} <span className="text-xs text-gray-400">({item.count})</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">No feedback data yet</p>
                  )}
                </div>
              </div>

              {/* Recent Evaluations Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Evaluations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendee</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">One Word</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {evaluationData.recentEvaluations && evaluationData.recentEvaluations.slice(0, 10).map((evalItem: any) => (
                        <tr key={evalItem.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-700">{evalItem.attendee_name || 'Anonymous'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{evalItem.course}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold text-gray-900">{evalItem.overall}</span>
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{evalItem.one_word || '-'}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{evalItem.comments || '-'}</td>
                        </tr>
                      ))}
                      {(!evaluationData.recentEvaluations || evaluationData.recentEvaluations.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No evaluations yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Add Training Record</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Training Date</label><input type="date" value={newRecord.training_date} onChange={(e) => setNewRecord({...newRecord, training_date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Attendee Name *</label><input type="text" placeholder="Full name" value={newRecord.attendee_name} onChange={(e) => setNewRecord({...newRecord, attendee_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><input type="text" placeholder="Job role" value={newRecord.role} onChange={(e) => setNewRecord({...newRecord, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Course *</label><input type="text" placeholder="Course name" value={newRecord.course} onChange={(e) => setNewRecord({...newRecord, course: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Facilitator</label><input type="text" placeholder="Trainer name" value={newRecord.facilitator} onChange={(e) => setNewRecord({...newRecord, facilitator: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label><input type="text" placeholder="Line manager" value={newRecord.supervisor} onChange={(e) => setNewRecord({...newRecord, supervisor: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input type="text" placeholder="Department" value={newRecord.department} onChange={(e) => setNewRecord({...newRecord, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label><input type="number" step="0.5" placeholder="Hours" value={newRecord.duration_hours} onChange={(e) => setNewRecord({...newRecord, duration_hours: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleAddRecord} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm">Add Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Edit Record</h2>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Training Date</label><input type="date" value={editingRecord.training_date} onChange={(e) => setEditingRecord({...editingRecord, training_date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Attendee Name</label><input type="text" value={editingRecord.attendee_name} onChange={(e) => setEditingRecord({...editingRecord, attendee_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><input type="text" value={editingRecord.role || ''} onChange={(e) => setEditingRecord({...editingRecord, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Course</label><input type="text" value={editingRecord.course} onChange={(e) => setEditingRecord({...editingRecord, course: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Facilitator</label><input type="text" value={editingRecord.facilitator} onChange={(e) => setEditingRecord({...editingRecord, facilitator: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label><input type="text" value={editingRecord.supervisor || ''} onChange={(e) => setEditingRecord({...editingRecord, supervisor: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input type="text" value={editingRecord.department} onChange={(e) => setEditingRecord({...editingRecord, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration Hours</label><input type="number" step="0.5" value={editingRecord.duration_hours} onChange={(e) => setEditingRecord({...editingRecord, duration_hours: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
              <button onClick={() => setEditingRecord(null)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleUpdateRecord} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Import Excel</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-700">Download template from the Excel icon in the top bar</p>
              </div>
              {importPreview.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Preview ({importData.length} records):</p>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(importPreview[0]).slice(0, 6).map(key => (
                            <th key={key} className="px-3 py-2 border text-left text-xs font-medium text-gray-500">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).slice(0, 6).map((val: any, i) => (
                              <td key={i} className="px-3 py-2 border text-gray-600">{String(val).slice(0, 30)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-sm">Import {importData.length} Records</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
