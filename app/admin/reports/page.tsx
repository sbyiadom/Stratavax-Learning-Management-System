'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, ChevronRight, Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  LogOut, Upload, FileSpreadsheet, Activity, Star, Trash2, Plus, Edit, Filter, RefreshCw,
  Maximize2, GraduationCap, Settings, HelpCircle, LayoutDashboard, Calendar, UserCheck, PieChart
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart as RePieChart, Pie, Cell, ComposedChart
} from 'recharts'

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [records, setRecords] = useState<any[]>([])
  const [filteredRecords, setFilteredRecords] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [dateRangePreset, setDateRangePreset] = useState('all')
  const [evaluationData, setEvaluationData] = useState<any>({
    total: 0,
    averages: { content: 0, facilitator: 0, logistics: 0, engagement: 0, applicability: 0, overall: 0 },
    wordCloud: [],
    recentEvaluations: [],
    byCourse: [],
    ratingDistribution: { overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  })
  
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', supervisor: '', role: '', course: '', facilitator: '', department: '', attendee: ''
  })
  
  const [filterOptions, setFilterOptions] = useState({
    supervisors: [] as string[], roles: [] as string[], courses: [] as string[],
    facilitators: [] as string[], departments: [] as string[], attendees: [] as string[]
  })
  
  const [stats, setStats] = useState({
    totalHours: 0, totalRecords: 0, totalDepartments: 0, totalUsers: 0, totalCourses: 0,
    totalEnrollments: 0, completedCourses: 0, inProgressCourses: 0, averageProgress: 0,
    completionRate: 0, activeUsers: 0, newUsersThisMonth: 0, certificatesIssued: 0,
    totalEvaluations: 0, averageRating: 0, monthlyGrowth: 0
  })
  
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [facilitatorData, setFacilitatorData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [newRecord, setNewRecord] = useState({
    training_date: new Date().toISOString().split('T')[0], attendee_name: '', role: '',
    course: '', facilitator: '', supervisor: '', department: '', duration_hours: 0
  })
  
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  useEffect(() => {
    if (tabParam === 'training') setActiveTab('training')
    else if (tabParam === 'evaluations') setActiveTab('evaluations')
    else setActiveTab('overview')
  }, [tabParam])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      await loadAllData()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => { applyFilters() }, [records, filters])

  const loadAllData = async () => {
    await Promise.all([
      loadTrainingRecords(), loadDashboardStats(), loadMonthlyTrends(),
      loadDepartmentData(), loadFacilitatorData(), loadEvaluationStats()
    ])
  }

  const loadTrainingRecords = async () => {
    const { data } = await supabase.from('training_records').select('*').order('training_date', { ascending: false })
    setRecords(data || [])
    const totalHours = (data || []).reduce((sum, r) => sum + (r.duration_hours || 0), 0)
    const departments = new Set((data || []).map(r => r.department).filter(Boolean))
    
    if (data) {
      const supervisors: string[] = [], roles: string[] = [], courses: string[] = [], facilitators: string[] = [], departmentsList: string[] = [], attendees: string[] = []
      const sSet = new Set(), rSet = new Set(), cSet = new Set(), fSet = new Set(), dSet = new Set(), aSet = new Set()
      data.forEach(record => {
        if (record.supervisor && !sSet.has(record.supervisor)) { sSet.add(record.supervisor); supervisors.push(record.supervisor) }
        if (record.role && !rSet.has(record.role)) { rSet.add(record.role); roles.push(record.role) }
        if (record.course && !cSet.has(record.course)) { cSet.add(record.course); courses.push(record.course) }
        if (record.facilitator && !fSet.has(record.facilitator)) { fSet.add(record.facilitator); facilitators.push(record.facilitator) }
        if (record.department && !dSet.has(record.department)) { dSet.add(record.department); departmentsList.push(record.department) }
        if (record.attendee_name && !aSet.has(record.attendee_name)) { aSet.add(record.attendee_name); attendees.push(record.attendee_name) }
      })
      setFilterOptions({ supervisors: supervisors.sort(), roles: roles.sort(), courses: courses.sort(), facilitators: facilitators.sort(), departments: departmentsList.sort(), attendees: attendees.sort() })
    }
    setStats(prev => ({ ...prev, totalHours, totalRecords: data?.length || 0, totalDepartments: departments.size }))
  }

  const applyFilters = () => {
    let filtered = [...records]
    if (filters.startDate) filtered = filtered.filter(r => r.training_date >= filters.startDate)
    if (filters.endDate) filtered = filtered.filter(r => r.training_date <= filters.endDate)
    if (filters.supervisor) filtered = filtered.filter(r => r.supervisor === filters.supervisor)
    if (filters.role) filtered = filtered.filter(r => r.role === filters.role)
    if (filters.course) filtered = filtered.filter(r => r.course === filters.course)
    if (filters.facilitator) filtered = filtered.filter(r => r.facilitator === filters.facilitator)
    if (filters.department) filtered = filtered.filter(r => r.department === filters.department)
    if (filters.attendee) filtered = filtered.filter(r => r.attendee_name === filters.attendee)
    setFilteredRecords(filtered)
  }

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', supervisor: '', role: '', course: '', facilitator: '', department: '', attendee: '' })
    setDateRangePreset('all')
  }

  const setDateRange = (preset: string) => {
    setDateRangePreset(preset)
    const today = new Date()
    let startDate = ''
    if (preset === 'week') { const d = new Date(today); d.setDate(today.getDate() - 7); startDate = d.toISOString().split('T')[0] }
    else if (preset === 'month') { const d = new Date(today); d.setMonth(today.getMonth() - 1); startDate = d.toISOString().split('T')[0] }
    else if (preset === 'quarter') { const d = new Date(today); d.setMonth(today.getMonth() - 3); startDate = d.toISOString().split('T')[0] }
    setFilters({ ...filters, startDate, endDate: today.toISOString().split('T')[0] })
  }

  const loadEvaluationStats = async () => {
    try {
      const res = await fetch('/api/training/stats')
      const data = await res.json()
      if (data?.success) { setEvaluationData(data); setStats(prev => ({ ...prev, totalEvaluations: data.total || 0, averageRating: data.averages?.overall || 0 })) }
    } catch (error) { console.error('Error loading evaluation stats:', error) }
  }

  const loadDashboardStats = async () => {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true)
    const { data: enrollments } = await supabase.from('enrollments').select('progress_percentage, completed_at, user_id, enrolled_at')
    const totalEnrollments = enrollments?.length || 0
    const completedCourses = enrollments?.filter(e => e.completed_at).length || 0
    const inProgressCourses = enrollments?.filter(e => !e.completed_at && e.progress_percentage > 0).length || 0
    const avgProgress = totalEnrollments > 0 ? Math.round(enrollments!.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / totalEnrollments) : 0
    const completionRate = totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsersList = enrollments?.filter(e => e.enrolled_at && new Date(e.enrolled_at) > thirtyDaysAgo).map(e => e.user_id) || []
    const uniqueActiveUsers = new Set(activeUsersList).size || 0
    const firstDayOfMonth = new Date(); firstDayOfMonth.setDate(1)
    const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString())
    const { count: certificates } = await supabase.from('certificates').select('*', { count: 'exact', head: true })
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1)
    const { data: lastMonthRecords } = await supabase.from('training_records').select('id').gte('created_at', lastMonth.toISOString()).lt('created_at', firstDayOfMonth.toISOString())
    const monthlyGrowth = lastMonthRecords?.length ? ((stats.totalRecords - lastMonthRecords.length) / lastMonthRecords.length) * 100 : 0
    setStats(prev => ({ ...prev, totalUsers: totalUsers || 0, totalCourses: totalCourses || 0, totalEnrollments, completedCourses, inProgressCourses, averageProgress: avgProgress, completionRate, activeUsers: uniqueActiveUsers, newUsersThisMonth: newUsers || 0, certificatesIssued: certificates || 0, monthlyGrowth }))
  }

  const loadMonthlyTrends = async () => {
    const { data: enrollments } = await supabase.from('enrollments').select('enrolled_at, completed_at')
    const { data: profiles } = await supabase.from('profiles').select('created_at')
    const { data: trainingRecords } = await supabase.from('training_records').select('training_date, duration_hours')
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
        trainingHours: trainingRecords?.filter(r => r.training_date && new Date(r.training_date) >= month && new Date(r.training_date) < nextMonth).reduce((sum, r) => sum + (r.duration_hours || 0), 0) || 0
      })
    }
    setMonthlyData(months)
  }

  const loadDepartmentData = async () => {
    const { data: records } = await supabase.from('training_records').select('department, duration_hours')
    if (records?.length) {
      const deptMap = new Map()
      records.forEach((r: any) => { if (r.department) deptMap.set(r.department, (deptMap.get(r.department) || 0) + (r.duration_hours || 0)) })
      setDepartmentData(Array.from(deptMap.entries()).map(([name, hours]) => ({ name, hours })))
    }
  }

  const loadFacilitatorData = async () => {
    const { data: records } = await supabase.from('training_records').select('facilitator, duration_hours')
    if (records?.length) {
      const facMap = new Map()
      records.forEach((r: any) => { if (r.facilitator) facMap.set(r.facilitator, (facMap.get(r.facilitator) || 0) + (r.duration_hours || 0)) })
      setFacilitatorData(Array.from(facMap.entries()).map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours).slice(0, 5))
    }
  }

  const handleAddRecord = async () => {
    if (!newRecord.attendee_name || !newRecord.course) { alert('Please fill in attendee name and course'); return }
    const { error } = await supabase.from('training_records').insert({ ...newRecord, source: 'manual' })
    if (!error) { await loadAllData(); setShowAddModal(false); setNewRecord({ training_date: new Date().toISOString().split('T')[0], attendee_name: '', role: '', course: '', facilitator: '', supervisor: '', department: '', duration_hours: 0 }); alert('Record added successfully') }
    else alert('Error adding record: ' + error.message)
  }

  const handleUpdateRecord = async () => {
    if (!editingRecord) return
    const { error } = await supabase.from('training_records').update(editingRecord).eq('id', editingRecord.id)
    if (!error) { await loadAllData(); setEditingRecord(null); alert('Record updated successfully') }
    else alert('Error updating record')
  }

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Delete this record?')) {
      await supabase.from('training_evaluations').delete().eq('training_record_id', id)
      const { error } = await supabase.from('training_records').delete().eq('id', id)
      if (!error) { await loadAllData(); alert('Record deleted successfully') }
      else alert('Error deleting record')
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 'Training Date': new Date().toISOString().split('T')[0], 'Attendee Name': 'John Doe', 'Role': 'Employee', 'Course': 'Leadership 101', 'Facilitator': 'Dr. Johnson', 'Supervisor': 'Jane Manager', 'Department': 'HR', 'Duration Hours': 4 }])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Template'); XLSX.writeFile(wb, 'training-template.xlsx')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: 'binary' })
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
      setImportData(jsonData); setImportPreview(jsonData.slice(0, 5)); setShowImportModal(true)
    }
    reader.readAsBinaryString(file)
  }

  const confirmImport = async () => {
    let success = 0
    for (const row of importData) {
      const { error } = await supabase.from('training_records').insert({
        training_date: row['Training Date'] || row['training_date'] || new Date().toISOString().split('T')[0],
        attendee_name: row['Attendee Name'] || row['attendee_name'] || row['Name'] || '',
        role: row['Role'] || row['role'] || '',
        course: row['Course'] || row['course'] || '',
        facilitator: row['Facilitator'] || row['facilitator'] || '',
        supervisor: row['Supervisor'] || row['supervisor'] || '',
        department: row['Department'] || row['department'] || '',
        duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0),
        source: 'manual_import'
      })
      if (!error) success++
    }
    await loadAllData(); setShowImportModal(false); setImportData([]); alert(`Imported ${success} records`)
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRecords.map((r: any) => ({
      'Training Date': r.training_date, 'Attendee Name': r.attendee_name, 'Role': r.role || '', 'Course': r.course,
      'Facilitator': r.facilitator, 'Supervisor': r.supervisor || '', 'Department': r.department,
      'Location': r.location || '', 'Duration Hours': r.duration_hours, 'Source': r.source || 'manual'
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Training Records'); XLSX.writeFile(wb, `training-data-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login') }

  const radarData = [
    { subject: 'Content', rating: evaluationData.averages.content },
    { subject: 'Facilitator', rating: evaluationData.averages.facilitator },
    { subject: 'Logistics', rating: evaluationData.averages.logistics },
    { subject: 'Engagement', rating: evaluationData.averages.engagement },
    { subject: 'Applicability', rating: evaluationData.averages.applicability }
  ]

  const ratingDistributionData = [
    { name: '5 Stars', value: evaluationData.ratingDistribution?.overall?.[5] || 0, color: '#10b981' },
    { name: '4 Stars', value: evaluationData.ratingDistribution?.overall?.[4] || 0, color: '#3b82f6' },
    { name: '3 Stars', value: evaluationData.ratingDistribution?.overall?.[3] || 0, color: '#f59e0b' },
    { name: '2 Stars', value: evaluationData.ratingDistribution?.overall?.[2] || 0, color: '#ef4444' },
    { name: '1 Star', value: evaluationData.ratingDistribution?.overall?.[1] || 0, color: '#6b7280' }
  ].filter(item => item.value > 0)

  const navItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, color: 'blue' },
    { id: 'training', name: 'Training Records', icon: FileSpreadsheet, color: 'green' },
    { id: 'evaluations', name: 'Evaluations', icon: Star, color: 'purple' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-500">Loading analytics...</p></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Full-width Color Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Executive Analytics</h1>
                <p className="text-blue-100 text-sm">Training intelligence & performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportToExcel} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                <Download size={16} /> Export
              </button>
              <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                <Upload size={16} /> Import
              </button>
              <button onClick={handleSignOut} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                <LogOut size={16} /> Sign Out
              </button>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-medium">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Vertical Navigation Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 shadow-sm min-h-[calc(100vh-80px)]">
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserCheck className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Welcome back</p>
                    <p className="font-semibold text-gray-800">{user?.email?.split('@')[0] || 'Admin'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                const colorClasses = {
                  blue: isActive ? 'bg-blue-50 text-blue-700 border-blue-500' : 'text-gray-600 hover:bg-gray-50',
                  green: isActive ? 'bg-green-50 text-green-700 border-green-500' : 'text-gray-600 hover:bg-gray-50',
                  purple: isActive ? 'bg-purple-50 text-purple-700 border-purple-500' : 'text-gray-600 hover:bg-gray-50'
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      router.push(`/admin/reports${item.id !== 'overview' ? `?tab=${item.id}` : ''}`)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${colorClasses[item.color as keyof typeof colorClasses]} ${isActive ? 'border-l-4 font-medium' : ''}`}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                    {isActive && <ChevronRight size={16} className="ml-auto" />}
                  </button>
                )
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-gray-500" />
                  <p className="text-xs font-medium text-gray-500">Training Summary</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRecords}</p>
                <p className="text-xs text-gray-500">Total training records</p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Completion Rate</span>
                    <span className="font-semibold text-gray-700">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Training Hours</p><p className="text-2xl font-bold text-gray-800">{stats.totalHours}</p><p className="text-xs text-green-600 mt-1">+{stats.monthlyGrowth.toFixed(1)}%</p></div>
                <div className="p-3 bg-blue-50 rounded-xl"><Clock className="text-blue-600" size={24} /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Total Records</p><p className="text-2xl font-bold text-gray-800">{stats.totalRecords}</p><p className="text-xs text-gray-500 mt-1">{stats.totalDepartments} departments</p></div>
                <div className="p-3 bg-purple-50 rounded-xl"><FileSpreadsheet className="text-purple-600" size={24} /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Avg. Rating</p><p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p><p className="text-xs text-gray-500 mt-1">out of 5.0</p></div>
                <div className="p-3 bg-yellow-50 rounded-xl"><Star className="text-yellow-600" size={24} fill="currentColor" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Completion Rate</p><p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p><p className="text-xs text-gray-500 mt-1">{stats.completedCourses} completed</p></div>
                <div className="p-3 bg-green-50 rounded-xl"><CheckCircle className="text-green-600" size={24} /></div>
              </div>
            </div>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-blue-700">Active Learners</span><Users className="text-blue-600" size={22} /></div>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeUsers}</p><p className="text-xs text-gray-500 mt-1">of {stats.totalUsers} total users</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-green-700">Course Engagement</span><BookOpen className="text-green-600" size={22} /></div>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalEnrollments}</p><p className="text-xs text-gray-500 mt-1">across {stats.totalCourses} courses</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-purple-700">Certificates Issued</span><Award className="text-purple-600" size={22} /></div>
                  <p className="text-3xl font-bold text-gray-800">{stats.certificatesIssued}</p><p className="text-xs text-gray-500 mt-1">+{stats.completedCourses} this period</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Hours by Department</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={departmentData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="hours" fill="#3b82f6" radius={[0, 8, 8, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Facilitators</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={facilitatorData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Performance Trends</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" /><Tooltip /><Legend /><Bar yAxisId="left" dataKey="enrollments" fill="#3b82f6" name="Enrollments" /><Bar yAxisId="left" dataKey="completions" fill="#10b981" name="Completions" /><Line yAxisId="right" type="monotone" dataKey="trainingHours" stroke="#f59e0b" name="Training Hours" strokeWidth={2} /></ComposedChart>
                </ResponsiveContainer>
              </div>

              {stats.totalEvaluations > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Effectiveness</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis domain={[0, 5]} /><Radar name="Rating" dataKey="rating" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} /><Tooltip /></RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedback Word Cloud</h3>
                    <div className="flex flex-wrap gap-2 min-h-[250px] items-center justify-center p-4 bg-gray-50 rounded-xl">
                      {evaluationData.wordCloud?.length > 0 ? evaluationData.wordCloud.map((item: any, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-gray-700 rounded-full" style={{ fontSize: `${Math.max(12, Math.min(28, 12 + item.count * 4))}px` }}>{item.word} ({item.count})</span>
                      )) : <p className="text-gray-400">No feedback yet</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Training Records Tab */}
          {activeTab === 'training' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-lg font-semibold text-gray-800">Training Records</h2><p className="text-sm text-gray-500">{filteredRecords.length} records • {stats.totalHours} total hours</p></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex gap-1 bg-white rounded-lg p-1 border"><button onClick={() => setDateRange('week')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Week</button><button onClick={() => setDateRange('month')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Month</button><button onClick={() => setDateRange('quarter')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'quarter' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Quarter</button><button onClick={() => setDateRange('all')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>All</button></div>
                    <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-2"><Filter size={14} /> Filters</button>
                    <button onClick={clearFilters} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-2"><RefreshCw size={14} /> Clear</button>
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"><Plus size={14} /> Add</button>
                    <button onClick={() => setShowImportModal(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2"><Upload size={14} /> Import</button>
                  </div>
                </div>
                {showFilters && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select value={filters.attendee} onChange={(e) => setFilters({...filters, attendee: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Attendees</option>{filterOptions.attendees.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                    <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Roles</option>{filterOptions.roles.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                    <select value={filters.course} onChange={(e) => setFilters({...filters, course: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Courses</option>{filterOptions.courses.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                    <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Departments</option>{filterOptions.departments.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b"><tr>{['Date', 'Attendee', 'Role', 'Course', 'Facilitator', 'Dept', 'Hours', 'Source', 'Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y">
                    {filteredRecords.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50"><td className="px-5 py-3 text-sm">{new Date(r.training_date).toLocaleDateString()}</td><td className="px-5 py-3 text-sm font-medium">{r.attendee_name || '-'}</td><td className="px-5 py-3 text-sm">{r.role || '-'}</td><td className="px-5 py-3 text-sm">{r.course}</td><td className="px-5 py-3 text-sm">{r.facilitator || '-'}</td><td className="px-5 py-3 text-sm">{r.department || '-'}</td><td className="px-5 py-3 text-sm">{r.duration_hours}</td><td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs ${r.source === 'google_form' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.source || 'manual'}</span></td><td className="px-5 py-3"><div className="flex gap-2"><button onClick={() => setEditingRecord(r)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button><button onClick={() => handleDeleteRecord(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></div></td></tr>
                    ))}
                    {filteredRecords.length === 0 && <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">No records found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evaluations Tab */}
          {activeTab === 'evaluations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-5 text-center border"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{evaluationData.total}</p></div>
                <div className="bg-white rounded-xl p-5 text-center border"><p className="text-sm text-gray-500">Overall</p><p className="text-2xl font-bold text-yellow-600">{evaluationData.averages.overall}</p><p className="text-xs">/5</p></div>
                <div className="bg-white rounded-xl p-5 text-center border"><p className="text-sm text-gray-500">Content</p><p className="text-xl font-bold text-blue-600">{evaluationData.averages.content}</p></div>
                <div className="bg-white rounded-xl p-5 text-center border"><p className="text-sm text-gray-500">Facilitator</p><p className="text-xl font-bold text-green-600">{evaluationData.averages.facilitator}</p></div>
                <div className="bg-white rounded-xl p-5 text-center border"><p className="text-sm text-gray-500">Engagement</p><p className="text-xl font-bold text-purple-600">{evaluationData.averages.engagement}</p></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border"><h3 className="font-semibold mb-4">Rating Distribution</h3><ResponsiveContainer width="100%" height={260}><RePieChart><Pie data={ratingDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{ratingDistributionData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></RePieChart></ResponsiveContainer></div>
                <div className="bg-white rounded-xl p-6 border"><h3 className="font-semibold mb-4">Course Performance</h3><div className="space-y-3 max-h-[260px] overflow-auto">{evaluationData.byCourse?.slice(0, 5).map((c: any, i: number) => (<div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded"><span className="text-sm">{c.course}</span><div className="flex items-center gap-2"><Star size={14} className="text-yellow-500" /><span className="font-semibold">{c.overall}</span><div className="w-16 bg-gray-200 rounded-full h-1"><div className="bg-green-500 h-1 rounded-full" style={{ width: `${(c.overall / 5) * 100}%` }} /></div></div></div>))}</div></div>
              </div>

              <div className="bg-white rounded-xl p-6 border"><h3 className="font-semibold mb-4">Word Cloud</h3><div className="flex flex-wrap gap-2 justify-center p-4 bg-gray-50 rounded-lg">{evaluationData.wordCloud?.length > 0 ? evaluationData.wordCloud.map((w: any, i: number) => (<span key={i} className="px-3 py-1 bg-blue-50 rounded-full" style={{ fontSize: `${12 + w.count * 2}px` }}>{w.word} ({w.count})</span>)) : <p className="text-gray-400">No feedback</p>}</div></div>

              <div className="bg-white rounded-xl overflow-hidden border"><div className="px-6 py-4 bg-gray-50 border-b"><h3 className="font-semibold">Recent Evaluations</h3></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Attendee</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Course</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Rating</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">One Word</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Comments</th></tr></thead><tbody>{evaluationData.recentEvaluations?.slice(0, 8).map((e: any) => (<tr key={e.id} className="hover:bg-gray-50"><td className="px-6 py-3 text-sm">{e.attendee_name || 'Anonymous'}</td><td className="px-6 py-3 text-sm">{e.course}</td><td className="px-6 py-3"><div className="flex items-center gap-1"><span className="font-semibold">{e.overall}</span><Star size={12} className="text-yellow-500 fill-yellow-500" /></div></td><td className="px-6 py-3"><span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs">{e.one_word || '-'}</span></td><td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{e.comments || '-'}</td></tr>))}</tbody></table></div></div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto"><div className="p-5 border-b"><h2 className="text-xl font-semibold">Add Training Record</h2></div><div className="p-5 space-y-3">{/* form fields */}<button onClick={() => setShowAddModal(false)}>Cancel</button><button onClick={handleAddRecord}>Add</button></div></div></div>)}
      {editingRecord && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl max-w-md w-full"><div className="p-5 border-b"><h2>Edit Record</h2></div><div className="p-5 space-y-3">{/* edit fields */}<button onClick={() => setEditingRecord(null)}>Cancel</button><button onClick={handleUpdateRecord}>Save</button></div></div></div>)}
      {showImportModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl max-w-2xl w-full"><div className="p-5 border-b"><h2>Import Excel</h2></div><div className="p-5">{importPreview.length > 0 && <div>Preview ({importData.length} records)</div>}<button onClick={() => setShowImportModal(false)}>Cancel</button><button onClick={confirmImport}>Import</button></div></div></div>)}
    </div>
  )
}
