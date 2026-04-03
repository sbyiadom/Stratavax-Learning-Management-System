'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Award,
  Calendar,
  Download,
  Search,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  Home,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  ChevronDown,
  Crown,
  Star,
  User,
  Mail,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileSpreadsheet
} from 'lucide-react'

type Assessment = {
  id: string
  title: string
  course_name: string
  attendee_name: string
  staff_number: string
  department: string
  pre_score: number
  post_score: number
  difference: number
  percent_shift: number
  passed: boolean
  created_at: string
}

export default function AdminAssessmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [userRole, setUserRole] = useState<string>('')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      // Allow both admin and supervisor to access this page
      if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
        router.push('/dashboard')
        return
      }
      
      setUserRole(profile?.role || 'user')
      setUser(user)
      await loadAssessments()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadAssessments = async () => {
    try {
      // Load evaluation reports which contain assessment data
      const { data, error } = await supabase
        .from('evaluation_reports')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Transform data for display
      const formattedData = data?.map(item => ({
        id: item.id,
        title: item.course_name,
        course_name: item.course_name,
        attendee_name: item.name_surname,
        staff_number: item.staff_number,
        department: item.department || 'N/A',
        pre_score: item.pre_assessment_score,
        post_score: item.post_assessment_score,
        difference: item.post_assessment_score - item.pre_assessment_score,
        percent_shift: item.possible_score > 0 
          ? ((item.post_assessment_score - item.pre_assessment_score) / item.possible_score) * 100 
          : 0,
        passed: item.post_assessment_score >= item.pass_mark,
        created_at: item.created_at
      })) || []
      
      setAssessments(formattedData)
    } catch (error) {
      console.error('Error loading assessments:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.attendee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.staff_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === 'all' || assessment.department === selectedDepartment
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'passed' && assessment.passed) ||
                         (selectedStatus === 'failed' && !assessment.passed)
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const stats = {
    total: assessments.length,
    passed: assessments.filter(a => a.passed).length,
    failed: assessments.filter(a => !a.passed).length,
    avgShift: assessments.length > 0 
      ? Math.round(assessments.reduce((acc, a) => acc + a.percent_shift, 0) / assessments.length) 
      : 0
  }

  // Fix: Use forEach instead of Set spread
  const departments: string[] = []
  assessments.forEach(assessment => {
    if (assessment.department && !departments.includes(assessment.department)) {
      departments.push(assessment.department)
    }
  })
  departments.sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded">
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">
                {userRole === 'admin' ? 'Admin Portal' : 'Supervisor Portal'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {userRole === 'admin' ? 'A' : 'S'}
              </div>
              <span className="text-sm font-medium hidden md:block">
                {userRole === 'admin' ? 'Admin' : 'Supervisor'}
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
            <Link href={userRole === 'admin' ? "/admin/reports?tab=overview" : "/dashboard/evaluation-reports"} className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <BarChart3 size={20} />
              {!sidebarCollapsed && <span className="text-sm">Overview</span>}
            </Link>
            
            <Link href="/admin/assessments" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-red-50 text-red-600">
              <FileSpreadsheet size={20} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Assessments</span>}
            </Link>
            
            {userRole === 'admin' && (
              <>
                <Link href="/admin/reports?tab=training" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
                  <FileText size={20} />
                  {!sidebarCollapsed && <span className="text-sm">Training Records</span>}
                </Link>
                
                <Link href="/admin/reports?tab=evaluations" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
                  <Award size={20} />
                  {!sidebarCollapsed && <span className="text-sm">Evaluations</span>}
                </Link>
                
                <Link href="/admin/reports?tab=users" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
                  <Users size={20} />
                  {!sidebarCollapsed && <span className="text-sm">User Management</span>}
                </Link>
              </>
            )}
          </nav>
          
          <div className="p-4 border-t">
            <button onClick={handleSignOut} className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-md text-gray-600 hover:bg-gray-100">
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Assessment Reports</h1>
            <p className="text-sm text-gray-500 mt-1">View pre and post assessment results</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average % Shift</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgShift}%</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, staff number, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          {/* Assessments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Attendee</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Staff #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Pre</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Post</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Diff</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">% Shift</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {assessment.attendee_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{assessment.attendee_name}</span>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assessment.staff_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] truncate">{assessment.course_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assessment.department}</td>
                      <td className="px-6 py-4 text-sm text-center">{assessment.pre_score}</td>
                      <td className="px-6 py-4 text-sm text-center font-medium">{assessment.post_score}</td>
                      <td className={`px-6 py-4 text-sm text-center ${assessment.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {assessment.difference >= 0 ? `+${assessment.difference}` : assessment.difference}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${assessment.percent_shift >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {Math.round(assessment.percent_shift)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {assessment.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle size={12} /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={12} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredAssessments.length === 0 && (
              <div className="text-center py-12">
                <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No assessment records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
