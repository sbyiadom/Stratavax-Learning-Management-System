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
  Filter,
  UserCircle,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Home,
  LayoutDashboard
} from 'lucide-react'

type TeamMember = {
  id: string
  name: string
  email: string
  department: string
  role: string
  avatar?: string
  enrolledCourses: number
  completedCourses: number
  inProgressCourses: number
  totalPoints: number
  lastActive: string
}

type TeamStats = {
  totalMembers: number
  totalEnrollments: number
  totalCompletions: number
  averageProgress: number
  topPerformers: TeamMember[]
  recentActivity: any[]
}

export default function ManagerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    totalEnrollments: 0,
    totalCompletions: 0,
    averageProgress: 0,
    topPerformers: [],
    recentActivity: []
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        router.push('/login')
        return
      }

      // Mock data for demonstration - In production, this would come from a 'team_members' table
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          name: 'Kenny Londaisha',
          email: 'kenny.l@stratavax.com',
          department: 'Route To Market',
          role: 'Route Manager',
          enrolledCourses: 8,
          completedCourses: 5,
          inProgressCourses: 3,
          totalPoints: 1250,
          lastActive: '2026-03-11'
        },
        {
          id: '2',
          name: 'Mamabeka Maponya',
          email: 'mamabeka.m@stratavax.com',
          department: 'HO Logistics',
          role: 'Logistics Coordinator',
          enrolledCourses: 6,
          completedCourses: 4,
          inProgressCourses: 2,
          totalPoints: 980,
          lastActive: '2026-03-10'
        },
        {
          id: '3',
          name: 'Thato Rasethuntsa',
          email: 'thato.r@stratavax.com',
          department: 'HO Logistics',
          role: 'Warehouse Supervisor',
          enrolledCourses: 7,
          completedCourses: 4,
          inProgressCourses: 3,
          totalPoints: 1050,
          lastActive: '2026-03-11'
        },
        {
          id: '4',
          name: 'Fatima Selai',
          email: 'fatima.s@stratavax.com',
          department: 'HO Logistics',
          role: 'Inventory Specialist',
          enrolledCourses: 5,
          completedCourses: 3,
          inProgressCourses: 2,
          totalPoints: 820,
          lastActive: '2026-03-09'
        },
        {
          id: '5',
          name: 'Samuel Boakye',
          email: 'samuel.b@stratavax.com',
          department: 'Engineering',
          role: 'Maintenance Manager',
          enrolledCourses: 12,
          completedCourses: 8,
          inProgressCourses: 4,
          totalPoints: 1650,
          lastActive: '2026-03-11'
        },
        {
          id: '6',
          name: 'John Doe',
          email: 'john.d@stratavax.com',
          department: 'Engineering',
          role: 'Electrical Engineer',
          enrolledCourses: 9,
          completedCourses: 6,
          inProgressCourses: 3,
          totalPoints: 1340,
          lastActive: '2026-03-10'
        }
      ]

      setTeamMembers(mockTeamMembers)

      // Calculate stats
      const totalMembers = mockTeamMembers.length
      const totalEnrollments = mockTeamMembers.reduce((acc, m) => acc + m.enrolledCourses, 0)
      const totalCompletions = mockTeamMembers.reduce((acc, m) => acc + m.completedCourses, 0)
      const averageProgress = Math.round((totalCompletions / totalEnrollments) * 100)
      
      // Get top performers
      const topPerformers = [...mockTeamMembers]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3)

      setStats({
        totalMembers,
        totalEnrollments,
        totalCompletions,
        averageProgress,
        topPerformers,
        recentActivity: []
      })

      setLoading(false)
    }

    loadData()
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

  const departments = Array.from(new Set(teamMembers.map(m => m.department)))
  
  const filteredMembers = teamMembers.filter(member => {
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          </nav>
        </div>
      </div>

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
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalMembers}</h3>
              <p className="text-xs text-gray-500 mt-1">Active members</p>
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.topPerformers.map((member, index) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg hover:shadow-md transition">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">{member.totalPoints}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search team members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.role}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.enrolledCourses}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">{member.completedCourses}</td>
                      <td className="px-6 py-4 text-sm text-yellow-600 font-medium">{member.inProgressCourses}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">{member.totalPoints}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.lastActive}</td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </button>
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
