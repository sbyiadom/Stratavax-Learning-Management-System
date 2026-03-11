'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  ChevronRight, 
  Award, 
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
  BarChart3,
  Download,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  Star,
  Trophy,
  Filter,
  UserCircle,
  Mail,
  Phone
} from 'lucide-react'

type StudentProfile = {
  id: string
  full_name: string
  email: string
  department: string | null
  role: string | null
  avatar_url: string | null
  total_points: number
  enrolled_courses: number
  completed_courses: number
  in_progress_courses: number
  last_active?: string
}

type ManagerStats = {
  totalStudents: number
  totalEnrollments: number
  totalCompletions: number
  averageProgress: number
  topPerformers: StudentProfile[]
}

export default function ManagerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [stats, setStats] = useState<ManagerStats>({
    totalStudents: 0,
    totalEnrollments: 0,
    totalCompletions: 0,
    averageProgress: 0,
    topPerformers: []
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadManagerData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch all students with their enrollment data
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          enrollments (
            course_id,
            progress_percentage,
            status,
            completed_at
          )
        `)
        .order('total_points', { ascending: false })

      if (error) {
        console.error('Error fetching students:', error)
      }

      if (profiles) {
        // Calculate stats for each student
        const studentsWithStats: StudentProfile[] = profiles.map(profile => {
          const enrollments = profile.enrollments || []
          const completed = enrollments.filter((e: any) => e.completed_at).length
          const inProgress = enrollments.filter((e: any) => e.status === 'active' && !e.completed_at).length
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            department: profile.department,
            role: profile.role,
            avatar_url: profile.avatar_url,
            total_points: profile.total_points || 0,
            enrolled_courses: enrollments.length,
            completed_courses: completed,
            in_progress_courses: inProgress,
            last_active: new Date().toISOString().split('T')[0]
          }
        })

        setStudents(studentsWithStats)

        // Extract unique departments
        const uniqueDepts = Array.from(
          new Set(studentsWithStats.map(s => s.department).filter(Boolean))
        ) as string[]
        setDepartments(uniqueDepts)

        // Calculate overall stats
        const totalStudents = studentsWithStats.length
        const totalEnrollments = studentsWithStats.reduce((acc, s) => acc + s.enrolled_courses, 0)
        const totalCompletions = studentsWithStats.reduce((acc, s) => acc + s.completed_courses, 0)
        const averageProgress = totalEnrollments > 0 
          ? Math.round((totalCompletions / totalEnrollments) * 100) 
          : 0

        // Get top performers
        const topPerformers = [...studentsWithStats]
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 3)

        setStats({
          totalStudents,
          totalEnrollments,
          totalCompletions,
          averageProgress,
          topPerformers
        })
      }

      setLoading(false)
    }

    loadManagerData()
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
          <p className="text-gray-600">Loading Manager Dashboard...</p>
        </div>
      </div>
    )
  }

  const filteredStudents = students.filter(student => {
    const matchesDepartment = selectedDepartment === 'all' || student.department === selectedDepartment
    const matchesSearch = 
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.role && student.role.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesDepartment && matchesSearch
  })

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
                <Users className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">Stratavax Manager</span>
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
              <span className="text-sm font-medium hidden md:block">Manager</span>
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
              <LayoutDashboard size={20} />
              {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
            </Link>
            <Link href="/dashboard/manager" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
              <Users size={20} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Line Manager</span>}
            </Link>
            <Link href="/dashboard/reports" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <BarChart3 size={20} />
              {!sidebarCollapsed && <span className="text-sm">Reports</span>}
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
                <LayoutDashboard size={20} />
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link href="/dashboard/manager" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
                <Users size={20} />
                <span className="text-sm font-medium">Line Manager</span>
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
            <span className="text-gray-900">Line Manager Dashboard</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Team Performance Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor your team's learning progress and achievements</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Download size={16} />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={22} />
                </div>
                <span className="text-sm font-medium text-gray-600">Team Size</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
              <p className="text-xs text-gray-500 mt-1">Active learners</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <BookOpen className="text-green-600" size={22} />
                </div>
                <span className="text-sm font-medium text-gray-600">Enrollments</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</h3>
              <p className="text-xs text-gray-500 mt-1">Total course enrollments</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <CheckCircle className="text-purple-600" size={22} />
                </div>
                <span className="text-sm font-medium text-gray-600">Completions</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalCompletions}</h3>
              <p className="text-xs text-gray-500 mt-1">Courses completed</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-yellow-100 rounded-lg">
                  <TrendingUp className="text-yellow-600" size={22} />
                </div>
                <span className="text-sm font-medium text-gray-600">Progress Rate</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</h3>
              <p className="text-xs text-gray-500 mt-1">Average completion</p>
            </div>
          </div>

          {/* Top Performers */}
          {stats.topPerformers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topPerformers.map((student, index) => (
                  <div key={student.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg hover:shadow-md transition">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-xs text-gray-500">{student.department || 'No department'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">{student.total_points}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.role || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.enrolled_courses}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">{student.completed_courses}</td>
                      <td className="px-6 py-4 text-sm text-yellow-600 font-medium">{student.in_progress_courses}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">{student.total_points}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.last_active || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No students found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
