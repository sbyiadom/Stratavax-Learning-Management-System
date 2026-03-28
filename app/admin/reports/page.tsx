'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, ChevronRight, Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  LogOut, Upload, FileSpreadsheet, Activity, Star, Trash2, Plus, Edit, Filter, RefreshCw,
  GraduationCap, LayoutDashboard, Calendar, UserCheck,
  ExternalLink, Shield, UserCog, Eye, Crown
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart as RePieChart, Pie, Cell, ComposedChart
} from 'recharts'

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [records, setRecords] = useState<any[]>([])
  const [filteredRecords, setFilteredRecords] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showRequestCourseModal, setShowRequestCourseModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [dateRangePreset, setDateRangePreset] = useState('all')
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
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
  
  const userRole = userProfile?.role || 'user'
  const isAdmin = userRole === 'admin'
  const isSupervisor = userRole === 'supervisor' || isAdmin
  const canAddManualRecords = isSupervisor
  const canRequestCourses = isSupervisor
  const canImport = isAdmin
  const canViewCourseManagement = isAdmin
  const canManageUsers = isAdmin
  const canEditRecords = isSupervisor
  const canDeleteRecords = isAdmin

  useEffect(() => {
    if (tabParam === 'training') setActiveTab('training')
    else if (tabParam === 'evaluations') setActiveTab('evaluations')
    else if (tabParam === 'users') setActiveTab('users')
    else setActiveTab('overview')
  }, [tabParam])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()
      setUserProfile(profile)
      
      await loadAllData()
      if (isAdmin) {
        await loadAllUsers()
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => { applyFilters() }, [records, filters])

  const loadAllUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (data.success && data.users) {
        setAllUsers(data.users)
      } else {
        console.error('Failed to load users:', data)
        setAllUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setAllUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole.toUpperCase()}?`)) return
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })
      const data = await response.json()
      if (data.success) {
        await loadAllUsers()
        alert(`User role updated to ${newRole.toUpperCase()}`)
      } else {
        alert('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role')
    }
  }

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

  const handleRequestCourse = async () => {
    if (!canRequestCourses) {
      alert('You do not have permission to request courses.')
      return
    }
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform', '_blank')
    setShowRequestCourseModal(false)
    alert('Course request form opened.')
  }

  const handleAddRecord = async () => {
    if (!canAddManualRecords) {
      alert('Only supervisors and administrators can add manual records.')
      return
    }
    if (!newRecord.attendee_name || !newRecord.course) { alert('Please fill in attendee name and course'); return }
    const { error } = await supabase.from('training_records').insert({ ...newRecord, source: 'manual' })
    if (!error) { await loadAllData(); setShowAddModal(false); setNewRecord({ training_date: new Date().toISOString().split('T')[0], attendee_name: '', role: '', course: '', facilitator: '', supervisor: '', department: '', duration_hours: 0 }); alert('Record added successfully') }
    else alert('Error adding record: ' + error.message)
  }

  const handleUpdateRecord = async () => {
    if (!canEditRecords) {
      alert('Only supervisors and administrators can edit records.')
      return
    }
    if (!editingRecord) return
    const { error } = await supabase.from('training_records').update(editingRecord).eq('id', editingRecord.id)
    if (!error) { await loadAllData(); setEditingRecord(null); alert('Record updated successfully') }
    else alert('Error updating record')
  }

  const handleDeleteRecord = async (id: string) => {
    if (!canDeleteRecords) {
      alert('Only administrators can delete records.')
      return
    }
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
    if (!canImport) {
      alert('Only administrators can import records.')
      return
    }
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
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, color: 'blue', adminOnly: false },
    { id: 'training', name: 'Training Records', icon: FileSpreadsheet, color: 'green', adminOnly: false },
    { id: 'evaluations', name: 'Evaluations', icon: Star, color: 'purple', adminOnly: false },
    { id: 'users', name: 'User Management', icon: Users, color: 'indigo', adminOnly: true },
    { id: 'request_course', name: 'Request Course', icon: Plus, color: 'blue', adminOnly: false, action: true },
    { id: 'course_management', name: 'Course Management', icon: FileSpreadsheet, color: 'green', adminOnly: true, external: true, url: 'https://docs.google.com/spreadsheets/d/1OgX1neXfczqEzZ_DQXTRwxZpZ7eDZh3mgQeYWlbB8xs/edit' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const getRoleBadgeForCurrentUser = () => {
    switch(userRole) {
      case 'admin': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><Crown size={12} /> Admin</span>
      case 'supervisor': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><UserCog size={12} /> Supervisor</span>
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1"><Eye size={12} /> Viewer</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
              <div className="ml-3">{getRoleBadgeForCurrentUser()}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform', '_blank')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                <FileSpreadsheet size={16} /> Training Registration
              </button>
              {canRequestCourses && (
                <button onClick={() => setShowRequestCourseModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                  <Plus size={16} /> Request Course
                </button>
              )}
              {canAddManualRecords && (
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                  <Plus size={16} /> Add Manual Record
                </button>
              )}
              {canViewCourseManagement && (
                <button onClick={() => window.open('https://docs.google.com/spreadsheets/d/1OgX1neXfczqEzZ_DQXTRwxZpZ7eDZh3mgQeYWlbB8xs/edit', '_blank')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                  <FileSpreadsheet size={16} /> Course Management
                </button>
              )}
              <button onClick={exportToExcel} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                <Download size={16} /> Export
              </button>
              {canImport && (
                <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <Upload size={16} /> Import
                </button>
              )}
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
                    <p className="font-semibold text-gray-800">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{userRole}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null
                const isActive = activeTab === item.id && !item.external && !item.action
                const colorClasses: Record<string, string> = {
                  blue: isActive ? 'bg-blue-50 text-blue-700 border-blue-500' : 'text-gray-600 hover:bg-gray-50',
                  green: isActive ? 'bg-green-50 text-green-700 border-green-500' : 'text-gray-600 hover:bg-gray-50',
                  purple: isActive ? 'bg-purple-50 text-purple-700 border-purple-500' : 'text-gray-600 hover:bg-gray-50',
                  indigo: isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-500' : 'text-gray-600 hover:bg-gray-50'
                }
                if (item.external) {
                  return (
                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50">
                      <item.icon size={20} /> <span>{item.name}</span> <ExternalLink size={14} className="ml-auto text-gray-400" />
                    </a>
                  )
                }
                if (item.action) {
                  return (
                    <button key={item.id} onClick={() => { if (item.id === 'request_course') setShowRequestCourseModal(true) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50">
                      <item.icon size={20} /> <span>{item.name}</span>
                    </button>
                  )
                }
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); router.push(`/admin/reports${item.id !== 'overview' ? `?tab=${item.id}` : ''}`) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${colorClasses[item.color]} ${isActive ? 'border-l-4 font-medium' : ''}`}>
                    <item.icon size={20} /> <span>{item.name}</span> {isActive && <ChevronRight size={16} className="ml-auto" />}
                  </button>
                )
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2"><Calendar size={14} className="text-gray-500" /><p className="text-xs font-medium text-gray-500">Training Summary</p></div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRecords}</p>
                <p className="text-xs text-gray-500">Total training records</p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Completion Rate</span><span className="font-semibold text-gray-700">{stats.completionRate}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.completionRate}%` }}></div></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border">
              <div className="flex justify-between">
                <div><p className="text-sm text-gray-500">Training Hours</p><p className="text-2xl font-bold">{stats.totalHours}</p><p className="text-xs text-green-600">+{stats.monthlyGrowth.toFixed(1)}%</p></div>
                <div className="p-3 bg-blue-50 rounded-xl"><Clock className="text-blue-600" size={24} /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border">
              <div className="flex justify-between">
                <div><p className="text-sm text-gray-500">Total Records</p><p className="text-2xl font-bold">{stats.totalRecords}</p><p className="text-xs text-gray-500">{stats.totalDepartments} depts</p></div>
                <div className="p-3 bg-purple-50 rounded-xl"><FileSpreadsheet className="text-purple-600" size={24} /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border">
              <div className="flex justify-between">
                <div><p className="text-sm text-gray-500">Avg. Rating</p><p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p><p className="text-xs text-gray-500">out of 5</p></div>
                <div className="p-3 bg-yellow-50 rounded-xl"><Star className="text-yellow-600" size={24} fill="currentColor" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border">
              <div className="flex justify-between">
                <div><p className="text-sm text-gray-500">Completion Rate</p><p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p><p className="text-xs text-gray-500">{stats.completedCourses} completed</p></div>
                <div className="p-3 bg-green-50 rounded-xl"><CheckCircle className="text-green-600" size={24} /></div>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex justify-between mb-3"><span className="text-sm font-medium text-blue-700">Active Learners</span><Users className="text-blue-600" size={22} /></div>
                  <p className="text-3xl font-bold">{stats.activeUsers}</p>
                  <p className="text-xs text-gray-500">of {stats.totalUsers} total users</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <div className="flex justify-between mb-3"><span className="text-sm font-medium text-green-700">Course Engagement</span><BookOpen className="text-green-600" size={22} /></div>
                  <p className="text-3xl font-bold">{stats.totalEnrollments}</p>
                  <p className="text-xs text-gray-500">across {stats.totalCourses} courses</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                  <div className="flex justify-between mb-3"><span className="text-sm font-medium text-purple-700">Certificates Issued</span><Award className="text-purple-600" size={22} /></div>
                  <p className="text-3xl font-bold">{stats.certificatesIssued}</p>
                  <p className="text-xs text-gray-500">+{stats.completedCourses} this period</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Training Hours by Department</h3>
                  <ResponsiveContainer height={280}>
                    <BarChart data={departmentData} layout="vertical">
                      <CartesianGrid /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[0,8,8,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Top Facilitators</h3>
                  <ResponsiveContainer height={280}>
                    <BarChart data={facilitatorData}>
                      <CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip />
                      <Bar dataKey="hours" fill="#10b981" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-semibold mb-4">Monthly Trends</h3>
                <ResponsiveContainer height={320}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid /><XAxis dataKey="month" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" />
                    <Tooltip /><Legend />
                    <Bar yAxisId="left" dataKey="enrollments" fill="#3b82f6" name="Enrollments" />
                    <Bar yAxisId="left" dataKey="completions" fill="#10b981" name="Completions" />
                    <Line yAxisId="right" type="monotone" dataKey="trainingHours" stroke="#f59e0b" name="Hours" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {stats.totalEvaluations > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4">Effectiveness Radar</h3>
                    <ResponsiveContainer height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis domain={[0,5]} />
                        <Radar dataKey="rating" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4">Word Cloud</h3>
                    <div className="flex flex-wrap gap-2 justify-center p-4 bg-gray-50 rounded-lg min-h-[250px]">
                      {evaluationData.wordCloud?.length > 0 ? evaluationData.wordCloud.map((w: any, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 rounded-full" style={{ fontSize: `${12 + w.count * 2}px` }}>{w.word} ({w.count})</span>
                      )) : <p className="text-gray-400">No feedback</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'training' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
              <div className="p-5 border-b bg-gray-50">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div><h2 className="font-semibold">Training Records</h2><p className="text-sm text-gray-500">{filteredRecords.length} records • {stats.totalHours} hours</p></div>
                  <div className="flex gap-2">
                    <div className="flex gap-1 bg-white rounded-lg p-1 border">
                      <button onClick={() => setDateRange('week')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'week' ? 'bg-blue-600 text-white' : ''}`}>Week</button>
                      <button onClick={() => setDateRange('month')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'month' ? 'bg-blue-600 text-white' : ''}`}>Month</button>
                      <button onClick={() => setDateRange('quarter')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'quarter' ? 'bg-blue-600 text-white' : ''}`}>Quarter</button>
                      <button onClick={() => setDateRange('all')} className={`px-3 py-1 text-xs rounded ${dateRangePreset === 'all' ? 'bg-blue-600 text-white' : ''}`}>All</button>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm flex items-center gap-2"><Filter size={14} /> Filters</button>
                    <button onClick={clearFilters} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm"><RefreshCw size={14} /></button>
                  </div>
                </div>
                {showFilters && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select value={filters.attendee} onChange={(e) => setFilters({...filters, attendee: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Attendees</option>{filterOptions.attendees.map(opt => <option key={opt}>{opt}</option>)}</select>
                    <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Roles</option>{filterOptions.roles.map(opt => <option key={opt}>{opt}</option>)}</select>
                    <select value={filters.course} onChange={(e) => setFilters({...filters, course: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Courses</option>{filterOptions.courses.map(opt => <option key={opt}>{opt}</option>)}</select>
                    <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="px-2 py-1.5 text-sm border rounded"><option value="">All Depts</option>{filterOptions.departments.map(opt => <option key={opt}>{opt}</option>)}</select>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Date</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Attendee</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Role</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Course</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Facilitator</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Dept</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Hours</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Source</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm">{new Date(r.training_date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-sm font-medium">{r.attendee_name || '-'}</td>
                        <td className="px-5 py-3 text-sm">{r.role || '-'}</td>
                        <td className="px-5 py-3 text-sm">{r.course}</td>
                        <td className="px-5 py-3 text-sm">{r.facilitator || '-'}</td>
                        <td className="px-5 py-3 text-sm">{r.department || '-'}</td>
                        <td className="px-5 py-3 text-sm">{r.duration_hours}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs ${r.source === 'google_form' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.source || 'manual'}</span></td>
                        <td className="px-5 py-3"><div className="flex gap-2">{canEditRecords && <button onClick={() => setEditingRecord(r)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>}{canDeleteRecords && <button onClick={() => handleDeleteRecord(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                <div className="bg-white rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Rating Distribution</h3>
                  <ResponsiveContainer height={260}>
                    <RePieChart>
                      <Pie data={ratingDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {ratingDistributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Course Performance</h3>
                  <div className="space-y-3 max-h-[260px] overflow-auto">
                    {evaluationData.byCourse?.slice(0,5).map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{c.course}</span>
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-yellow-500" />
                          <span className="font-semibold">{c.overall}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1"><div className="bg-green-500 h-1 rounded-full" style={{ width: `${(c.overall/5)*100}%` }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-semibold mb-4">Word Cloud</h3>
                <div className="flex flex-wrap gap-2 justify-center p-6 bg-gray-50 rounded-lg">
                  {evaluationData.wordCloud?.length > 0 ? evaluationData.wordCloud.map((w: any, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 rounded-full" style={{ fontSize: `${12 + w.count * 2}px` }}>{w.word} ({w.count})</span>
                  )) : <p className="text-gray-400">No feedback</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl overflow-hidden border">
                <div className="px-6 py-4 bg-gray-50 border-b"><h3 className="font-semibold">Recent Evaluations</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Attendee</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Course</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Rating</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">One Word</th><th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Comments</th></tr>
                    </thead>
                    <tbody>
                      {evaluationData.recentEvaluations?.slice(0,8).map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm">{e.attendee_name || 'Anonymous'}</td>
                          <td className="px-6 py-3 text-sm">{e.course}</td>
                          <td className="px-6 py-3"><div className="flex items-center gap-1"><span className="font-semibold">{e.overall}</span><Star size={12} className="text-yellow-500 fill-yellow-500" /></div></td>
                          <td className="px-6 py-3"><span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs">{e.one_word || '-'}</span></td>
                          <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{e.comments || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
              <div className="p-5 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
                    <p className="text-sm text-gray-500">Manage user roles and permissions</p>
                  </div>
                  <button onClick={loadAllUsers} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                {usersLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : allUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No users found</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Current Role</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Change Role</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User ID</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {allUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 text-sm font-medium text-gray-900">{u.email}</td>
                          <td className="px-5 py-4">
                            {u.role === 'admin' ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Crown size={12} /> Admin</span>
                            ) : u.role === 'supervisor' ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><UserCog size={12} /> Supervisor</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Eye size={12} /> Viewer</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => updateUserRole(u.id, 'user')} disabled={u.role === 'user'} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${u.role === 'user' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Eye size={12} /> Viewer</button>
                              <button onClick={() => updateUserRole(u.id, 'supervisor')} disabled={u.role === 'supervisor'} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${u.role === 'supervisor' ? 'bg-blue-200 text-blue-700 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}><UserCog size={12} /> Supervisor</button>
                              <button onClick={() => updateUserRole(u.id, 'admin')} disabled={u.role === 'admin'} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${u.role === 'admin' ? 'bg-red-200 text-red-700 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}><Crown size={12} /> Admin</button>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-500">
                  <strong>Permission Levels:</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="inline-flex items-center gap-1"><Eye size={12} className="text-gray-500" /> Viewer</span> - Can view all data and submit training registrations via Google Forms</li>
                    <li><span className="inline-flex items-center gap-1"><UserCog size={12} className="text-blue-500" /> Supervisor</span> - Viewer permissions + Can add manual records and request courses</li>
                    <li><span className="inline-flex items-center gap-1"><Crown size={12} className="text-red-500" /> Admin</span> - Full access to everything including user management, imports, and course management</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-5 border-b"><h2 className="text-xl font-semibold">Add Training Record</h2></div>
            <div className="p-5 space-y-3">
              <input type="date" value={newRecord.training_date} onChange={(e) => setNewRecord({...newRecord, training_date: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Attendee Name *" value={newRecord.attendee_name} onChange={(e) => setNewRecord({...newRecord, attendee_name: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Role" value={newRecord.role} onChange={(e) => setNewRecord({...newRecord, role: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Course *" value={newRecord.course} onChange={(e) => setNewRecord({...newRecord, course: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Facilitator" value={newRecord.facilitator} onChange={(e) => setNewRecord({...newRecord, facilitator: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Supervisor" value={newRecord.supervisor} onChange={(e) => setNewRecord({...newRecord, supervisor: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Department" value={newRecord.department} onChange={(e) => setNewRecord({...newRecord, department: e.target.value})} className="w-full p-2 border rounded" />
              <input type="number" step="0.5" placeholder="Duration Hours" value={newRecord.duration_hours} onChange={(e) => setNewRecord({...newRecord, duration_hours: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t"><button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={handleAddRecord} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button></div>
          </div>
        </div>
      )}
      
      {showRequestCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b"><h2 className="text-xl font-semibold">Request a Course</h2><p className="text-sm text-gray-500">You will be redirected to the Google Form</p></div>
            <div className="p-5"><p>Click continue to open the course request form where you can submit new course details.</p></div>
            <div className="flex justify-end gap-3 p-5 border-t"><button onClick={() => setShowRequestCourseModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={handleRequestCourse} className="px-4 py-2 bg-blue-600 text-white rounded">Continue to Form</button></div>
          </div>
        </div>
      )}
      
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b"><h2 className="text-xl font-semibold">Edit Record</h2></div>
            <div className="p-5 space-y-3">
              <input type="date" value={editingRecord.training_date} onChange={(e) => setEditingRecord({...editingRecord, training_date: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" value={editingRecord.attendee_name} onChange={(e) => setEditingRecord({...editingRecord, attendee_name: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" value={editingRecord.role || ''} onChange={(e) => setEditingRecord({...editingRecord, role: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" value={editingRecord.course} onChange={(e) => setEditingRecord({...editingRecord, course: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" value={editingRecord.facilitator} onChange={(e) => setEditingRecord({...editingRecord, facilitator: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" value={editingRecord.supervisor || ''} onChange={(e) => setEditingRecord({...editingRecord, supervisor: e.target.value})} className="w-full p-2 border rounded" />
              <input type="text" value={editingRecord.department} onChange={(e) => setEditingRecord({...editingRecord, department: e.target.value})} className="w-full p-2 border rounded" />
              <input type="number" step="0.5" value={editingRecord.duration_hours} onChange={(e) => setEditingRecord({...editingRecord, duration_hours: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t"><button onClick={() => setEditingRecord(null)} className="px-4 py-2 border rounded">Cancel</button><button onClick={handleUpdateRecord} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button></div>
          </div>
        </div>
      )}
      
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-5 border-b"><h2 className="text-xl font-semibold">Import Excel</h2></div>
            <div className="p-5">{importPreview.length > 0 && <div>Preview ({importData.length} records)</div>}</div>
            <div className="flex justify-end gap-3 p-5 border-t"><button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded">Import</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
