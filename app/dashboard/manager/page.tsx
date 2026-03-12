'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  Download,
  BarChart3,
  TrendingUp,
  Award,
  UserCircle,
  Mail,
  Calendar,
  GraduationCap,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Bell,
  HelpCircle,
  LogOut,
  Home,
  LayoutDashboard,
  Settings,
  Star,
  Trophy,
  Briefcase,
  UserPlus
} from 'lucide-react'

type TeamMember = {
  student_id: string
  student_user_id: string
  student_name: string
  student_email: string
  department: string | null
  role: string | null
  total_points: number
  courses_started: number
  courses_completed: number
  courses_in_progress: number
  assignments_submitted: number
  assignments_passed: number
  assignments_failed: number
  assignments_pending_review: number
  avg_assignment_grade: number
  last_active: string
  assigned_at?: string
}

type ManagerStats = {
  totalMembers: number
  activeMembers: number
  totalCourses: number
  completedCourses: number
  totalAssignments: number
  passedAssignments: number
  averageGrade: number
  topPerformer: TeamMember | null
}

type UserProfile = {
  id: string
  user_id: string
  full_name: string
  email: string
  department: string | null
  role: string | null
  total_points: number
}

type Enrollment = {
  course_id: string
  completed_at: string | null
  status: string
}

type UserAssignment = {
  status: string
  grade: number | null
}

export default function ManagerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [isManager, setIsManager] = useState(false)
  const [viewMode, setViewMode] = useState<'team' | 'all'>('team')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [stats, setStats] = useState<ManagerStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalCourses: 0,
    completedCourses: 0,
    totalAssignments: 0,
    passedAssignments: 0,
    averageGrade: 0,
    topPerformer: null
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadManagerData()
  }, [viewMode])

  const loadManagerData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (!user) {
      router.push('/login')
      return
    }

    // Get current user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      setUserProfile(profile)
      
      // Check if user is a manager/supervisor (has role = 'manager' or 'supervisor')
      const hasManagerRole = profile.role === 'manager' || profile.role === 'supervisor' || profile.role === 'admin'
      setIsManager(hasManagerRole)

      if (viewMode === 'team' && hasManagerRole) {
        // Load supervisor's assigned team
        await loadAssignedTeam(profile.id)
      } else {
        // Load all students (for managers/admins)
        await loadAllStudents()
      }
    }

    setLoading(false)
  }

  const loadAssignedTeam = async (supervisorId: string) => {
    const { data: teamData } = await supabase
      .from('supervisor_student_progress')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('student_name')

    if (teamData) {
      setTeamMembers(teamData)
      setFilteredMembers(teamData)

      // Extract unique departments
      const depts = Array.from(new Set(teamData.map((m: any) => m.department).filter(Boolean))) as string[]
      setDepartments(depts)

      // Calculate team stats
      calculateStats(teamData)
    }
  }

  const loadAllStudents = async () => {
    const { data: allStudents } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        department,
        role,
        total_points
      `)
      .eq('role', 'student')
      .order('full_name')

    if (allStudents) {
      // For each student, get their progress
      const studentsWithProgress: TeamMember[] = await Promise.all(
        allStudents.map(async (student) => {
          // Get course progress
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id, completed_at, status')
            .eq('user_id', student.user_id)

          const courses_started = enrollments?.length || 0
          const courses_completed = enrollments?.filter((e: Enrollment) => e.completed_at).length || 0
          const courses_in_progress = enrollments?.filter((e: Enrollment) => !e.completed_at && e.status === 'active').length || 0

          // Get assignment progress
          const { data: assignments } = await supabase
            .from('user_assignments')
            .select('status, grade')
            .eq('user_id', student.user_id)

          const assignments_submitted = assignments?.length || 0
          const assignments_passed = assignments?.filter((a: UserAssignment) => a.status === 'passed').length || 0
          const assignments_failed = assignments?.filter((a: UserAssignment) => a.status === 'failed').length || 0
          const assignments_pending = assignments?.filter((a: UserAssignment) => a.status === 'submitted').length || 0
          
          // Fix the avg_grade calculation with proper type checking
          let avg_grade = 0
          if (assignments && assignments.length > 0) {
            const totalGrade = assignments.reduce((acc: number, a: UserAssignment) => acc + (a.grade || 0), 0)
            avg_grade = totalGrade / assignments.length
          }

          return {
            student_id: student.id,
            student_user_id: student.user_id,
            student_name: student.full_name,
            student_email: student.email,
            department: student.department,
            role: student.role,
            total_points: student.total_points || 0,
            courses_started,
            courses_completed,
            courses_in_progress,
            assignments_submitted,
            assignments_passed,
            assignments_failed,
            assignments_pending_review: assignments_pending,
            avg_assignment_grade: avg_grade,
            last_active: new Date().toISOString()
          }
        })
      )

      setTeamMembers(studentsWithProgress)
      setFilteredMembers(studentsWithProgress)

      // Extract unique departments
      const depts = Array.from(new Set(studentsWithProgress.map(m => m.department).filter(Boolean))) as string[]
      setDepartments(depts)

      // Calculate stats
      calculateStats(studentsWithProgress)
    }
  }

  const calculateStats = (members: TeamMember[]) => {
    const activeMembers = members.filter(m => {
      const lastActive = new Date(m.last_active)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return lastActive > thirtyDaysAgo
    }).length

    const totalCourses = members.reduce((acc, m) => acc + m.courses_started, 0)
    const completedCourses = members.reduce((acc, m) => acc + m.courses_completed, 0)
    const totalAssignments = members.reduce((acc, m) => acc + m.assignments_submitted, 0)
    const passedAssignments = members.reduce((acc, m) => acc + m.assignments_passed, 0)
    const averageGrade = members.length > 0 
      ? members.reduce((acc, m) => acc + m.avg_assignment_grade, 0) / members.length
      : 0

    const topPerformer = members.length > 0
      ? members.reduce((best, current) => 
          current.total_points > (best?.total_points || 0) ? current : best
        , members[0])
      : null

    setStats({
      totalMembers: members.length,
      activeMembers,
      totalCourses,
      completedCourses,
      totalAssignments,
      passedAssignments,
      averageGrade: Math.round(averageGrade),
      topPerformer
    })
  }

  useEffect(() => {
    let filtered = teamMembers

    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(m => m.department === departmentFilter)
    }

    setFilteredMembers(filtered)
  }, [searchQuery, departmentFilter, teamMembers])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

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
                <Briefcase className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">Manager Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isManager && (
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('team')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    viewMode === 'team' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Team
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    viewMode === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Students
                </button>
              </div>
            )}
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
              <span className="text-sm font-medium hidden md:block">
                {userProfile?.full_name?.split(' ')[0] || 'Manager'}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
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
                <Briefcase size={20} />
                <span className="text-sm font-medium">Manager</span>
              </Link>
              {isManager && (
                <>
                  <button
                    onClick={() => {
                      setViewMode('team')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100 ml-6"
                  >
                    <Users size={16} />
                    <span className="text-sm">My Team</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('all')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100 ml-6"
                  >
                    <Users size={16} />
                    <span className="text-sm">All Students</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-14">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {viewMode === 'team' ? 'My Team Performance' : 'All Students Performance'}
            </h1>
            <p className="text-gray-600">
              {viewMode === 'team' 
                ? 'Track your team members\' learning progress and achievements'
                : 'Overview of all students in the platform'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {viewMode === 'team' ? 'Team Size' : 'Total Students'}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                </div>
                <Users className="text-blue-600" size={24} />
              </div>
              <p className="text-xs text-green-600 mt-1">{stats.activeMembers} active this month</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Course Progress</p>
                  <p className="text-2xl font-bold">{stats.completedCourses}/{stats.totalCourses}</p>
                </div>
                <BookOpen className="text-green-600" size={24} />
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
                <div 
                  className="h-1.5 bg-green-600 rounded-full"
                  style={{ width: stats.totalCourses ? `${(stats.completedCourses/stats.totalCourses)*100}%` : '0%' }}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Assignments</p>
                  <p className="text-2xl font-bold">{stats.passedAssignments}/{stats.totalAssignments}</p>
                </div>
                <CheckCircle className="text-purple-600" size={24} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.passedAssignments} passed</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Grade</p>
                  <p className="text-2xl font-bold">{stats.averageGrade}%</p>
                </div>
                <Award className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          {/* Top Performer */}
          {stats.topPerformer && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-sm p-4 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy size={32} />
                  <div>
                    <p className="text-sm opacity-90">Top Performer</p>
                    <p className="text-xl font-bold">{stats.topPerformer.student_name}</p>
                    <p className="text-sm opacity-90">{stats.topPerformer.department} • {stats.topPerformer.total_points} points</p>
                  </div>
                </div>
                <span className="text-4xl">🏆</span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Download size={18} />
                Export Report
              </button>
            </div>
          </div>

          {/* Team Members Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMembers.map((member) => (
                    <tr key={member.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.student_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.student_name}</p>
                            <p className="text-xs text-gray-500">{member.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.department || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium">{member.courses_completed}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{member.courses_started}</span>
                          </div>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-1.5 bg-green-600 rounded-full"
                              style={{ width: member.courses_started ? `${(member.courses_completed/member.courses_started)*100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">{member.assignments_passed}</span>
                          <span className="text-yellow-600">{member.assignments_pending_review}</span>
                          <span className="text-red-600">{member.assignments_failed}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600">{member.assignments_submitted}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          member.avg_assignment_grade >= 70 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {Math.round(member.avg_assignment_grade)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-blue-600">{member.total_points}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(member.last_active).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/manager/student/${member.student_id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ChevronRight size={20} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No team members found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
