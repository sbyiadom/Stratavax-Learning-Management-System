'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  BarChart3, Download, ChevronRight, ChevronLeft,
  Users, BookOpen, CheckCircle, Clock, Award, TrendingUp,
  Menu, X, Home, LogOut, Upload, RefreshCw,
  Building, FileSpreadsheet, Activity, Star,
  FileDown, FileUp, Trash2, AlertCircle, Plus, Edit
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [records, setRecords] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
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
    certificatesIssued: 0
  })
  const [courseStats, setCourseStats] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [facilitatorData, setFacilitatorData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [newRecord, setNewRecord] = useState({
    training_date: new Date().toISOString().split('T')[0],
    attendee_name: '',
    course: '',
    facilitator: '',
    supervisor: '',
    department: '',
    duration_hours: 0
  })
  
  const supabase = createClient()
  const router = useRouter()

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
      loadTrainingRecords(),
      loadDashboardStats(),
      loadCourseStats(),
      loadMonthlyTrends(),
      loadDepartmentData(),
      loadFacilitatorData()
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
    
    setStats(prev => ({
      ...prev,
      totalHours: totalHours,
      totalRecords: data?.length || 0,
      totalDepartments: departments.size
    }))
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

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsersList = enrollments?.filter(e => e.enrolled_at && new Date(e.enrolled_at) > thirtyDaysAgo).map(e => e.user_id) || []
    const uniqueActiveUsers = new Set(activeUsersList).size || 0

    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString())
    const { count: certificates } = await supabase.from('certificates').select('*', { count: 'exact', head: true })

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
      certificatesIssued: certificates || 0
    }))
  }

  const loadCourseStats = async () => {
    const { data: courses } = await supabase.from('courses').select('id, title, enrollments (completed_at, progress_percentage)').eq('is_published', true)
    if (courses) {
      const stats = courses.map(course => {
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
      setCourseStats(stats.sort((a, b) => b.enrollments - a.enrollments))
    }
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
    if (records && records.length > 0) {
      const deptMap = new Map()
      records.forEach(record => {
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
      records.forEach(record => {
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

    const { error } = await supabase.from('training_records').insert({
      training_date: newRecord.training_date,
      attendee_name: newRecord.attendee_name,
      course: newRecord.course,
      facilitator: newRecord.facilitator,
      supervisor: newRecord.supervisor,
      department: newRecord.department,
      duration_hours: newRecord.duration_hours
    })

    if (!error) {
      await loadAllData()
      setShowAddModal(false)
      setNewRecord({
        training_date: new Date().toISOString().split('T')[0],
        attendee_name: '',
        course: '',
        facilitator: '',
        supervisor: '',
        department: '',
        duration_hours: 0
      })
      alert('Record added successfully')
    } else {
      alert('Error adding record')
    }
  }

  const handleUpdateRecord = async () => {
    if (!editingRecord) return

    const { error } = await supabase
      .from('training_records')
      .update({
        training_date: editingRecord.training_date,
        attendee_name: editingRecord.attendee_name,
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
    if (confirm('Delete this record?')) {
      const { error } = await supabase.from('training_records').delete().eq('id', id)
      if (!error) {
        await loadAllData()
        alert('Record deleted')
      } else {
        alert('Error deleting record')
      }
    }
  }

  const downloadTemplate = () => {
    const template = [{
      'Training Date': new Date().toISOString().split('T')[0],
      'Attendee Name': 'John Doe',
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
        course: row['Course'] || row['course'] || '',
        facilitator: row['Facilitator'] || row['facilitator'] || '',
        supervisor: row['Supervisor'] || row['supervisor'] || '',
        department: row['Department'] || row['department'] || '',
        duration_hours: parseFloat(row['Duration Hours'] || row['duration_hours'] || row['Hours'] || 0)
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
    const exportData = records.map(r => ({
      'Training Date': r.training_date,
      'Attendee Name': r.attendee_name,
      'Course': r.course,
      'Facilitator': r.facilitator,
      'Supervisor': r.supervisor || '',
      'Department': r.department,
      'Duration Hours': r.duration_hours
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
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={18} />
              </div>
              <span className="font-semibold">Stratavax Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadTemplate} className="p-2 hover:bg-gray-100 rounded" title="Template">
              <FileSpreadsheet size={18} className="text-green-600" />
            </button>
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-gray-100 rounded" title="Import">
              <Upload size={18} className="text-gray-600" />
            </button>
            <button onClick={exportToExcel} className="p-2 hover:bg-gray-100 rounded" title="Export">
              <Download size={18} className="text-gray-600" />
            </button>
            <div className="ml-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
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
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-3 py-2 w-full rounded-md ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BarChart3 size={20} /> {!sidebarCollapsed && <span>Overview</span>}
          </button>
          <button onClick={() => setActiveTab('courses')} className={`flex items-center gap-3 px-3 py-2 w-full rounded-md ${activeTab === 'courses' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen size={20} /> {!sidebarCollapsed && <span>Courses</span>}
          </button>
          <button onClick={() => setActiveTab('training')} className={`flex items-center gap-3 px-3 py-2 w-full rounded-md ${activeTab === 'training' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileSpreadsheet size={20} /> {!sidebarCollapsed && <span>Training Records</span>}
          </button>
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
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
              <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
                <BarChart3 size={20} /><span>Overview</span>
              </button>
              <button onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
                <BookOpen size={20} /><span>Courses</span>
              </button>
              <button onClick={() => { setActiveTab('training'); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-gray-600 hover:bg-gray-100">
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
                    <div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
                    <Users size={32} className="text-blue-500" />
                  </div>
                  <div className="mt-2 text-xs text-green-600">+{stats.newUsersThisMonth} this month</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Active Users</p><p className="text-2xl font-bold">{stats.activeUsers}</p></div>
                    <Activity size={32} className="text-green-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% engagement</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Enrollments</p><p className="text-2xl font-bold">{stats.totalEnrollments}</p></div>
                    <BookOpen size={32} className="text-purple-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">{stats.completionRate}% completion rate</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Certificates</p><p className="text-2xl font-bold">{stats.certificatesIssued}</p></div>
                    <Award size={32} className="text-yellow-500" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">+{stats.completedCourses} completed</div>
                </div>
              </div>

              {/* Progress Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Course Progress Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Completed</span><span>{stats.completedCourses}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: stats.totalEnrollments > 0 ? (stats.completedCourses / stats.totalEnrollments) * 100 + '%' : '0%' }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>In Progress</span><span>{stats.inProgressCourses}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: stats.totalEnrollments > 0 ? (stats.inProgressCourses / stats.totalEnrollments) * 100 + '%' : '0%' }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Not Started</span><span>{stats.totalEnrollments - stats.completedCourses - stats.inProgressCourses}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gray-400 h-2 rounded-full" style={{ width: stats.totalEnrollments > 0 ? ((stats.totalEnrollments - stats.completedCourses - stats.inProgressCourses) / stats.totalEnrollments) * 100 + '%' : '0%' }} /></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t"><div className="flex justify-between text-sm"><span>Average Progress</span><span className="font-bold">{stats.averageProgress}%</span></div></div>
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
                    <Line type="monotone" dataKey="trainingHours" stroke="#f59e0b" name="Training Hours" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Facilitators */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b"><h3 className="text-lg font-semibold">Top Facilitators</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Facilitator</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Training Hours</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {facilitatorData.map((fac: any) => (
                        <tr key={fac.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium">{fac.name}</td>
                          <td className="px-6 py-4 text-sm">{fac.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b"><h2 className="text-xl font-bold">Course Performance</h2><p className="text-sm text-gray-500">Enrollments, completions, and progress rates</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Course</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Enrollments</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Completions</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Completion Rate</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Avg Progress</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {courseStats.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{course.title}</td>
                        <td className="px-6 py-4 text-sm">{course.enrollments}</td>
                        <td className="px-6 py-4 text-sm">{course.completions}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{course.completionRate}%</span></td>
                        <td className="px-6 py-4"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: course.averageProgress + '%' }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Training Records Tab */}
          {activeTab === 'training' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <div><h2 className="text-lg font-semibold">Training Records</h2><p className="text-sm text-gray-500">Total Hours: {stats.totalHours} | Total Records: {stats.totalRecords}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Add Record</button>
                  <button onClick={() => setShowImportModal(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">Import Excel</button>
                  <button onClick={exportToExcel} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm">Export</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Attendee</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Course</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Facilitator</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Department</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Hours</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{new Date(record.training_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{record.attendee_name}</td>
                        <td className="px-4 py-3 text-sm">{record.course}</td>
                        <td className="px-4 py-3 text-sm">{record.facilitator}</td>
                        <td className="px-4 py-3 text-sm">{record.department}</td>
                        <td className="px-4 py-3 text-sm">{record.duration_hours}</td>
                        <td className="px-4 py-3 text-sm">
                          <button onClick={() => setEditingRecord(record)} className="text-blue-600 hover:text-blue-800 mr-2"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteRecord(record.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No records. Click "Add Record" or "Import Excel" to add data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b"><h2 className="text-lg font-semibold">Add Training Record</h2><button onClick={() => setShowAddModal(false)}><X size={20} /></button></div>
            <div className="p-4 space-y-3">
              <input type="date" value={newRecord.training_date} onChange={(e) => setNewRecord({...newRecord, training_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Attendee Name *" value={newRecord.attendee_name} onChange={(e) => setNewRecord({...newRecord, attendee_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Course *" value={newRecord.course} onChange={(e) => setNewRecord({...newRecord, course: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Facilitator" value={newRecord.facilitator} onChange={(e) => setNewRecord({...newRecord, facilitator: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Supervisor" value={newRecord.supervisor} onChange={(e) => setNewRecord({...newRecord, supervisor: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Department" value={newRecord.department} onChange={(e) => setNewRecord({...newRecord, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="number" step="0.5" placeholder="Duration Hours" value={newRecord.duration_hours} onChange={(e) => setNewRecord({...newRecord, duration_hours: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t"><button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={handleAddRecord} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Record</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b"><h2 className="text-lg font-semibold">Edit Record</h2><button onClick={() => setEditingRecord(null)}><X size={20} /></button></div>
            <div className="p-4 space-y-3">
              <input type="date" value={editingRecord.training_date} onChange={(e) => setEditingRecord({...editingRecord, training_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={editingRecord.attendee_name} onChange={(e) => setEditingRecord({...editingRecord, attendee_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={editingRecord.course} onChange={(e) => setEditingRecord({...editingRecord, course: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={editingRecord.facilitator} onChange={(e) => setEditingRecord({...editingRecord, facilitator: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={editingRecord.supervisor || ''} onChange={(e) => setEditingRecord({...editingRecord, supervisor: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" value={editingRecord.department} onChange={(e) => setEditingRecord({...editingRecord, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="number" step="0.5" value={editingRecord.duration_hours} onChange={(e) => setEditingRecord({...editingRecord, duration_hours: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t"><button onClick={() => setEditingRecord(null)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={handleUpdateRecord} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button></div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b"><h2 className="text-lg font-semibold">Import Excel</h2><button onClick={() => setShowImportModal(false)}><X size={20} /></button></div>
            <div className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"><p className="text-sm text-blue-700">Download template from the Excel icon in top bar</p></div>
              {importPreview.length > 0 && (
                <div>
                  <p className="text-sm mb-2">Preview ({importData.length} records):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>{Object.keys(importPreview[0]).slice(0, 5).map(key => (<th key={key} className="px-3 py-2 border">{key}</th>))} </thead>
                      <tbody>{importPreview.map((row, idx) => (<tr key={idx}>{Object.values(row).slice(0, 5).map((val: any, i) => (<td key={i} className="px-3 py-2 border">{String(val).slice(0, 30)}</td>))}</tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t"><button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-lg">Import {importData.length} Records</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
