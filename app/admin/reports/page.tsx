'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Crown,
  Star,
  User,
  Mail,
  Shield,
  Save,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

type TrainingRecord = {
  id: string
  attendee_name: string
  course: string
  department: string
  training_date: string
  personnel_number: string
}

type Evaluation = {
  id: string
  attendee_name: string
  course: string
  content_rating: number
  facilitator_rating: number
  logistics_rating: number
  engagement_rating: number
  applicability_rating: number
  comments: string
  one_word: string
  created_at: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('analytics')
  const [users, setUsers] = useState<Profile[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'users' || tab === 'training' || tab === 'evaluations' || tab === 'analytics') {
      setActiveTab(tab)
    }
    checkAdminAndLoadData()
  }, [activeTab, searchParams])

  const checkAdminAndLoadData = async () => {
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
      
      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      
      setUser(user)
      await Promise.all([
        loadUsers(),
        loadTrainingRecords(),
        loadEvaluations()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadTrainingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('training_records')
        .select('*')
        .order('training_date', { ascending: false })
      
      if (error) throw error
      setTrainingRecords(data || [])
    } catch (error) {
      console.error('Error loading training records:', error)
    }
  }

  const loadEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('training_evaluations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Error loading evaluations:', error)
    }
  }

  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    setUpdatingUserId(userId)
    setErrorMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRoleValue })
        .eq('id', userId)
      
      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRoleValue } : user
      ))
      
      setSuccessMessage(`Role updated to ${newRoleValue.toUpperCase()} successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setShowConfirmModal(false)
      setSelectedUser(null)
      
    } catch (error: any) {
      console.error('Error updating role:', error)
      setErrorMessage(error.message)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const openRoleModal = (user: Profile, role: string) => {
    setSelectedUser(user)
    setNewRole(role)
    setShowConfirmModal(true)
  }

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"><Crown size={12} /> Admin</span>
      case 'supervisor':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"><Star size={12} /> Supervisor</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"><User size={12} /> User</span>
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Analytics Data Preparation
  const getStats = () => {
    const avgContent = evaluations.length > 0 
      ? evaluations.reduce((acc, e) => acc + (e.content_rating || 0), 0) / evaluations.length 
      : 0
    const avgFacilitator = evaluations.length > 0 
      ? evaluations.reduce((acc, e) => acc + (e.facilitator_rating || 0), 0) / evaluations.length 
      : 0
    const avgLogistics = evaluations.length > 0 
      ? evaluations.reduce((acc, e) => acc + (e.logistics_rating || 0), 0) / evaluations.length 
      : 0
    const avgEngagement = evaluations.length > 0 
      ? evaluations.reduce((acc, e) => acc + (e.engagement_rating || 0), 0) / evaluations.length 
      : 0
    const avgApplicability = evaluations.length > 0 
      ? evaluations.reduce((acc, e) => acc + (e.applicability_rating || 0), 0) / evaluations.length 
      : 0

    return {
      totalUsers: users.length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      totalSupervisors: users.filter(u => u.role === 'supervisor').length,
      totalRegularUsers: users.filter(u => u.role === 'user').length,
      totalTrainingRecords: trainingRecords.length,
      totalEvaluations: evaluations.length,
      avgContentRating: Math.round(avgContent * 10) / 10,
      avgFacilitatorRating: Math.round(avgFacilitator * 10) / 10,
      avgLogisticsRating: Math.round(avgLogistics * 10) / 10,
      avgEngagementRating: Math.round(avgEngagement * 10) / 10,
      avgApplicabilityRating: Math.round(avgApplicability * 10) / 10,
      overallAvg: Math.round((avgContent + avgFacilitator + avgLogistics + avgEngagement + avgApplicability) / 5 * 10) / 10
    }
  }

  // Rating distribution data for bar chart
  const ratingDistributionData = [
    { name: 'Content', rating: getStats().avgContentRating, fill: '#3b82f6' },
    { name: 'Facilitator', rating: getStats().avgFacilitatorRating, fill: '#10b981' },
    { name: 'Logistics', rating: getStats().avgLogisticsRating, fill: '#f59e0b' },
    { name: 'Engagement', rating: getStats().avgEngagementRating, fill: '#ef4444' },
    { name: 'Applicability', rating: getStats().avgApplicabilityRating, fill: '#8b5cf6' }
  ]

  // Course performance data
  const coursePerformance = () => {
    const courseMap = new Map<string, { count: number; total: number }>()
    evaluations.forEach(e => {
      const current = courseMap.get(e.course) || { count: 0, total: 0 }
      const avgRating = (e.content_rating + e.facilitator_rating + e.logistics_rating + e.engagement_rating + e.applicability_rating) / 5
      courseMap.set(e.course, {
        count: current.count + 1,
        total: current.total + avgRating
      })
    })
    const result = Array.from(courseMap.entries()).map(([name, data]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      rating: Math.round((data.total / data.count) * 10) / 10,
      participants: data.count
    })).sort((a, b) => b.rating - a.rating).slice(0, 5)
    
    // If no data, return empty array
    return result.length > 0 ? result : [{ name: 'No Data', rating: 0, participants: 0 }]
  }

  // Monthly trend data
  const monthlyTrends = () => {
    const monthMap = new Map<string, { total: number; count: number }>()
    evaluations.forEach(e => {
      const month = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const current = monthMap.get(month) || { total: 0, count: 0 }
      const avgRating = (e.content_rating + e.facilitator_rating + e.logistics_rating + e.engagement_rating + e.applicability_rating) / 5
      monthMap.set(month, {
        total: current.total + avgRating,
        count: current.count + 1
      })
    })
    const result = Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      rating: Math.round((data.total / data.count) * 10) / 10
    })).sort((a, b) => {
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateA.getTime() - dateB.getTime()
    })
    
    // If no data, return empty array with placeholder
    return result.length > 0 ? result : [{ month: 'No Data', rating: 0 }]
  }

  // Rating distribution pie chart data
  const ratingLevels = () => {
    const levels = { 'Excellent (4.5-5)': 0, 'Good (3.5-4.4)': 0, 'Average (2.5-3.4)': 0, 'Poor (<2.5)': 0 }
    evaluations.forEach(e => {
      const avgRating = (e.content_rating + e.facilitator_rating + e.logistics_rating + e.engagement_rating + e.applicability_rating) / 5
      if (avgRating >= 4.5) levels['Excellent (4.5-5)']++
      else if (avgRating >= 3.5) levels['Good (3.5-4.4)']++
      else if (avgRating >= 2.5) levels['Average (2.5-3.4)']++
      else levels['Poor (<2.5)']++
    })
    const result = Object.entries(levels).map(([name, value]) => ({ name, value }))
    // If no data, show placeholder
    if (evaluations.length === 0) {
      return [{ name: 'No Data', value: 1 }]
    }
    return result
  }

  const stats = getStats()
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
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
              <span className="font-semibold text-gray-900">Analytics Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                A
              </div>
              <span className="text-sm font-medium hidden md:block">Admin</span>
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
            <button
              onClick={() => { setActiveTab('analytics'); router.push('/admin/reports?tab=analytics') }}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <PieChart size={20} />
              {!sidebarCollapsed && <span className="text-sm">Analytics</span>}
            </button>
            
            <button
              onClick={() => { setActiveTab('training'); router.push('/admin/reports?tab=training') }}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'training' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText size={20} />
              {!sidebarCollapsed && <span className="text-sm">Training Records</span>}
            </button>
            
            <button
              onClick={() => { setActiveTab('evaluations'); router.push('/admin/reports?tab=evaluations') }}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'evaluations' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Award size={20} />
              {!sidebarCollapsed && <span className="text-sm">Evaluations</span>}
            </button>
            
            <button
              onClick={() => { setActiveTab('users'); router.push('/admin/reports?tab=users') }}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users size={20} />
              {!sidebarCollapsed && <span className="text-sm">User Management</span>}
            </button>
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
          
          {/* ANALYTICS DASHBOARD TAB */}
          {activeTab === 'analytics' && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Visual insights from training evaluations</p>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Evaluations</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Overall Rating</p>
                      <p className="text-2xl font-bold text-green-600">{stats.overallAvg}/5</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Training Records</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTrainingRecords}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Distribution Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" />
                    Rating Distribution by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ratingDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rating" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Average ratings across all evaluation categories
                  </div>
                </div>

                {/* Rating Level Pie Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart size={20} className="text-purple-500" />
                    Overall Satisfaction Levels
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={ratingLevels()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ratingLevels().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Distribution of training satisfaction levels
                  </div>
                </div>
              </div>

              {/* Course Performance Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-green-500" />
                    Top Performing Courses
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={coursePerformance()} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rating" fill="#10b981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Courses ranked by average participant rating
                  </div>
                </div>

                {/* Monthly Trend Line Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LineChart size={20} className="text-orange-500" />
                    Rating Trends Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrends()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="rating" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Monthly average rating trends over time
                  </div>
                </div>
              </div>

              {/* Summary Statistics */}
              {evaluations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-500" />
                    Key Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 mb-1">Highest Rated Category</p>
                      <p className="text-xl font-bold text-blue-700">
                        {ratingDistributionData.reduce((max, curr) => curr.rating > max.rating ? curr : max).name}
                      </p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">
                        {ratingDistributionData.reduce((max, curr) => curr.rating > max.rating ? curr : max).rating}/5
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 mb-1">Lowest Rated Category</p>
                      <p className="text-xl font-bold text-green-700">
                        {ratingDistributionData.reduce((min, curr) => curr.rating < min.rating ? curr : min).name}
                      </p>
                      <p className="text-2xl font-bold text-green-800 mt-1">
                        {ratingDistributionData.reduce((min, curr) => curr.rating < min.rating ? curr : min).rating}/5
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 mb-1">Total Participants</p>
                      <p className="text-2xl font-bold text-purple-700">{stats.totalEvaluations}</p>
                      <p className="text-sm text-purple-600 mt-1">Training Sessions</p>
                    </div>
                  </div>
                </div>
              )}
              
              {evaluations.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Award size={48} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Data Yet</h3>
                  <p className="text-gray-500">Once evaluations are submitted, analytics will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Training Records Tab */}
          {activeTab === 'training' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Training Records</h2>
                    <p className="text-sm text-gray-500 mt-1">View all training attendance records ({stats.totalTrainingRecords} records)</p>
                  </div>
                  <button onClick={loadTrainingRecords} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trainingRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{record.attendee_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.course}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.personnel_number || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(record.training_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {trainingRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No training records found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Evaluations Tab */}
          {activeTab === 'evaluations' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Course Evaluations</h2>
                    <p className="text-sm text-gray-500 mt-1">View all course evaluation feedback ({stats.totalEvaluations} evaluations)</p>
                  </div>
                  <button onClick={loadEvaluations} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Content</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilitator</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Logistics</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {evaluations.map((evalItem) => (
                      <tr key={evalItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{evalItem.attendee_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{evalItem.course}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {evalItem.content_rating || 0}/5
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {evalItem.facilitator_rating || 0}/5
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            {evalItem.logistics_rating || 0}/5
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {evalItem.engagement_rating || 0}/5
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                          {evalItem.comments || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(evalItem.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {evaluations.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <Award size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No evaluations found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions ({stats.totalUsers} users)</p>
                  </div>
                  <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {userItem.first_name?.[0] || userItem.email?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {userItem.first_name || ''} {userItem.last_name || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{userItem.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(userItem.role)}
                        </td>
                        <td className="px-6 py-4">
                          {updatingUserId === userItem.id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm text-gray-500">Updating...</span>
                            </div>
                          ) : (
                            <select
                              value={userItem.role}
                              onChange={(e) => openRoleModal(userItem, e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                            >
                              <option value="user">👤 User</option>
                              <option value="supervisor">⭐ Supervisor</option>
                              <option value="admin">👑 Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <Users size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No users found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Role Change Modal */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Role Change</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Change role for <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> from 
              <span className="font-medium"> {selectedUser.role} </span> to 
              <span className="font-medium"> {newRole}</span>?
            </p>
            
            {newRole === 'admin' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">⚠️ Admin users have full access to all features including user management.</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRoleChange(selectedUser.id, newRole)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
