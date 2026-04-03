'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  Home,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  ChevronDown,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calculator,
  RefreshCw,
  Save,
  Upload,
  FileSpreadsheet,
  Eye,
  Printer
} from 'lucide-react'

type EvaluationReport = {
  id: string
  course_name: string
  staff_number: string
  name_surname: string
  job_title: string | null
  plant: string | null
  department: string | null
  pass_mark: number
  pre_assessment_score: number
  post_assessment_score: number
  possible_score: number
  difference: number
  percent_shift: number
  re_test: boolean
  re_test_score: number | null
  commentary: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function EvaluationReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reports, setReports] = useState<EvaluationReport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingReport, setEditingReport] = useState<EvaluationReport | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [filters, setFilters] = useState({ courses: [], departments: [] })
  const [userRole, setUserRole] = useState<string>('')
  
  // Form state
  const [formData, setFormData] = useState({
    course_name: '',
    staff_number: '',
    name_surname: '',
    job_title: '',
    plant: '',
    department: '',
    pass_mark: 70,
    pre_assessment_score: 0,
    post_assessment_score: 0,
    possible_score: 100,
    re_test: false,
    re_test_score: '',
    commentary: '',
    status: 'submitted'  // Default to submitted for supervisors
  })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadUserAndReports()
  }, [statusFilter, departmentFilter])

  const loadUserAndReports = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    setUserRole(profile?.role || 'user')
    setUser(user)
    await loadReports()
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      let url = '/api/evaluation-reports?limit=200'
      if (statusFilter !== 'all') url += `&status=${statusFilter}`
      if (departmentFilter !== 'all') url += `&department=${departmentFilter}`
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setReports(result.data)
        if (result.filters) {
          setFilters(result.filters)
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  // Get live calculated values for preview
  const calculateMetrics = (pre: number, post: number, possible: number) => {
    const difference = post - pre
    const percentShift = possible > 0 ? (difference / possible) * 100 : 0
    return {
      difference,
      percentShift: Math.round(percentShift * 100) / 100
    }
  }

  const liveCalculations = calculateMetrics(
    formData.pre_assessment_score,
    formData.post_assessment_score,
    formData.possible_score
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = '/api/evaluation-reports'
    const method = editingReport ? 'PUT' : 'POST'
    const body = editingReport ? { ...formData, id: editingReport.id } : formData
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const result = await response.json()
    
    if (result.success) {
      setShowForm(false)
      setEditingReport(null)
      setFormData({
        course_name: '',
        staff_number: '',
        name_surname: '',
        job_title: '',
        plant: '',
        department: '',
        pass_mark: 70,
        pre_assessment_score: 0,
        post_assessment_score: 0,
        possible_score: 100,
        re_test: false,
        re_test_score: '',
        commentary: '',
        status: 'submitted'
      })
      loadReports()
    } else {
      alert(result.error || 'Failed to save report')
    }
  }

  const handleEdit = (report: EvaluationReport) => {
    setEditingReport(report)
    setFormData({
      course_name: report.course_name,
      staff_number: report.staff_number,
      name_surname: report.name_surname,
      job_title: report.job_title || '',
      plant: report.plant || '',
      department: report.department || '',
      pass_mark: report.pass_mark,
      pre_assessment_score: report.pre_assessment_score,
      post_assessment_score: report.post_assessment_score,
      possible_score: report.possible_score,
      re_test: report.re_test,
      re_test_score: report.re_test_score?.toString() || '',
      commentary: report.commentary || '',
      status: report.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    
    const response = await fetch(`/api/evaluation-reports?id=${id}`, { method: 'DELETE' })
    const result = await response.json()
    
    if (result.success) {
      loadReports()
    }
  }

  const exportToCSV = () => {
    const headers = ['Course Name', 'Staff Number', 'Name & Surname', 'Job Title', 'Plant', 'Department', 'Pass Mark', 'Pre Score', 'Post Score', 'Possible Score', 'Difference', '% Shift', 'Re-Test', 'Commentary', 'Status']
    
    const rows = filteredReports.map(r => [
      r.course_name,
      r.staff_number,
      r.name_surname,
      r.job_title || '',
      r.plant || '',
      r.department || '',
      r.pass_mark,
      r.pre_assessment_score,
      r.post_assessment_score,
      r.possible_score,
      r.difference,
      r.percent_shift,
      r.re_test ? 'Yes' : 'No',
      r.commentary || '',
      r.status
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evaluation-reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredReports = reports.filter(report => 
    report.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.name_surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.staff_number.includes(searchTerm)
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'submitted': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700"><CheckCircle size={12} className="inline mr-1" /> Submitted</span>
      case 'approved': return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"><CheckCircle size={12} className="inline mr-1" /> Approved</span>
      default: return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700"><Clock size={12} className="inline mr-1" /> Draft</span>
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isSupervisorOrAdmin = userRole === 'supervisor' || userRole === 'admin'

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded">
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">Evaluation Reports</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden md:block">
                {userRole === 'admin' ? 'Admin' : userRole === 'supervisor' ? 'Supervisor' : 'User'}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-14 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:block`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-end">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded">
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Home size={20} /> {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
            </Link>
            <Link href="/dashboard/evaluation-reports" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
              <FileText size={20} /> {!sidebarCollapsed && <span className="text-sm font-medium">Evaluation Reports</span>}
            </Link>
            <Link href="/admin/assessments" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <BarChart3 size={20} /> {!sidebarCollapsed && <span className="text-sm">Assessment Analytics</span>}
            </Link>
          </nav>
          <div className="p-4 border-t">
            <button onClick={handleSignOut} className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-md text-gray-600 hover:bg-gray-100">
              <LogOut size={20} /> {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Training Evaluation Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Manage pre/post assessment results and learner progress</p>
            </div>
            {isSupervisorOrAdmin && (
              <button
                onClick={() => { setEditingReport(null); setShowForm(true); }}
                className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={18} /> <span>New Evaluation Report</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by course, name, or staff number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {filters.departments.map((dept: string) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <button onClick={exportToCSV} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Download size={18} /> <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-50">
                  {/* Main headers */}
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Course</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Staff #</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Name</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Job Title</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Plant</th>
                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Dept</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Pass Mark</th>
                    <th colSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Assessment</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Diff</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">% Shift</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Re-Test</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Status</th>
                    <th rowSpan={2} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Actions</th>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 border-r">Pre</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 border-r">Post</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">{report.course_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.staff_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.name_surname}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.job_title || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.plant || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.department || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{report.pass_mark}%</td>
                      <td className="px-4 py-3 text-sm text-center">{report.pre_assessment_score}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold">{report.post_assessment_score}</td>
                      <td className={`px-4 py-3 text-sm text-center ${report.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {report.difference >= 0 ? `+${report.difference}` : report.difference}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.percent_shift >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {report.percent_shift}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {report.re_test ? <span className="text-orange-600">Yes</span> : <span className="text-gray-400">No</span>}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(report.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => handleEdit(report)} className="p-1 hover:bg-gray-100 rounded text-blue-600">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(report.id)} className="p-1 hover:bg-gray-100 rounded text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No evaluation reports found</p>
                {isSupervisorOrAdmin && (
                  <button onClick={() => setShowForm(true)} className="mt-3 text-blue-600 hover:underline">
                    Create your first report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Form - Data Entry */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{editingReport ? 'Edit Evaluation Report' : 'New Evaluation Report'}</h2>
                <button onClick={() => { setShowForm(false); setEditingReport(null); }} className="p-2 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                    <input type="text" name="course_name" required value={formData.course_name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Leadership Training" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Number *</label>
                    <input type="text" name="staff_number" required value={formData.staff_number} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., STF-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name & Surname *</label>
                    <input type="text" name="name_surname" required value={formData.name_surname} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input type="text" name="job_title" value={formData.job_title} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Senior Engineer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plant</label>
                    <input type="text" name="plant" value={formData.plant} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Plant A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Engineering" />
                  </div>
                </div>
              </div>

              {/* Assessment Scores */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">Assessment Scores</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Mark (%)</label>
                    <input type="number" name="pass_mark" value={formData.pass_mark} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Assessment Score</label>
                    <input type="number" name="pre_assessment_score" value={formData.pre_assessment_score} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="0-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post-Assessment Score</label>
                    <input type="number" name="post_assessment_score" value={formData.post_assessment_score} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="0-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Possible Score</label>
                    <input type="number" name="possible_score" value={formData.possible_score} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="100" />
                  </div>
                </div>

                {/* Live Calculation Preview */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4 text-sm flex-wrap gap-4">
                    <Calculator size={18} className="text-blue-600" />
                    <span>Difference: <strong className={liveCalculations.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {liveCalculations.difference >= 0 ? `+${liveCalculations.difference}` : liveCalculations.difference}
                    </strong></span>
                    <span>% Shift: <strong className={liveCalculations.percentShift >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {liveCalculations.percentShift}%
                    </strong></span>
                    <span>Passed: <strong>{formData.post_assessment_score >= formData.pass_mark ? 'Yes ✓' : 'No ✗'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" name="re_test" checked={formData.re_test} onChange={handleInputChange} className="w-4 h-4" />
                  <label className="text-sm font-medium text-gray-700">Re-Test Required</label>
                </div>
                {formData.re_test && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Re-Test Score</label>
                    <input type="number" name="re_test_score" value={formData.re_test_score} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentary / Notes</label>
                <textarea name="commentary" rows={3} value={formData.commentary} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Add any additional notes or observations..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditingReport(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Save size={16} /> <span>{editingReport ? 'Update Report' : 'Save Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
