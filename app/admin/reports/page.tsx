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
  Filter,
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
  Save,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

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
  created_at: string
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'users' || tab === 'training' || tab === 'evaluations') {
      setActiveTab(tab)
    }
    checkAdminAndLoadData()
  }, [activeTab])

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
      await loadUsers()
      await loadTrainingRecords()
      await loadEvaluations()
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
        .limit(50)
      
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
        .limit(50)
      
      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Error loading evaluations:', error)
    }
  }

  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    setUpdatingUserId(userId)
    
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
      
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update user role')
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

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const getStats = () => {
    return {
      totalUsers: users.length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      totalSupervisors: users.filter(u => u.role === 'supervisor').length,
      totalRegularUsers: users.filter(u => u.role === 'user').length,
      totalTrainingRecords: trainingRecords.length,
      totalEvaluations: evaluations.length,
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Success Message */}
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
              <span className="font-semibold text-gray-900">Admin Portal</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
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
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'overview' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <BarChart3 size={20} />
              {!sidebarCollapsed && <span className="text-sm">Overview</span>}
            </button>
            
            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'training' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText size={20} />
              {!sidebarCollapsed && <span className="text-sm">Training Records</span>}
            </button>
            
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'evaluations' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Award size={20} />
              {!sidebarCollapsed && <span className="text-sm">Evaluations</span>}
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-md transition ${activeTab === 'users' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Manage users, training records, and evaluations</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users size={24} className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Training Records</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTrainingRecords}</p>
                </div>
                <FileText size={24} className="text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Evaluations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
                </div>
                <Award size={24} className="text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Admins</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalAdmins}</p>
                </div>
                <Crown size={24} className="text-red-500" />
              </div>
            </div>
          </div>

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions - Click the dropdown to change a user's role</p>
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
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                              <p className="text-xs text-gray-400">ID: {userItem.id.slice(0, 8)}</p>
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
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              <span className="text-sm text-gray-500">Updating...</span>
                            </div>
                          ) : (
                            <select
                              value={userItem.role}
                              onChange={(e) => openRoleModal(userItem, e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white cursor-pointer"
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
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          )}

          {/* Training Records Tab */}
          {activeTab === 'training' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Training Records</h2>
                <p className="text-sm text-gray-500 mt-1">View all training attendance records</p>
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
                  </tbody>
                </table>
              </div>
              {trainingRecords.length === 0 && (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No training records found</p>
                </div>
              )}
            </div>
          )}

          {/* Evaluations Tab */}
          {activeTab === 'evaluations' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Course Evaluations</h2>
                <p className="text-sm text-gray-500 mt-1">View all course evaluation feedback</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Content</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilitator</th>
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(evalItem.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {evaluations.length === 0 && (
                <div className="text-center py-12">
                  <Award size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No evaluations found</p>
                </div>
              )}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Admins</span>
                    <span className="text-sm font-semibold text-red-600">{stats.totalAdmins}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.totalAdmins / stats.totalUsers) * 100}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Supervisors</span>
                    <span className="text-sm font-semibold text-blue-600">{stats.totalSupervisors}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.totalSupervisors / stats.totalUsers) * 100}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Regular Users</span>
                    <span className="text-sm font-semibold text-gray-600">{stats.totalRegularUsers}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(stats.totalRegularUsers / stats.totalUsers) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Training Records</span>
                    <span className="text-lg font-bold text-gray-900">{stats.totalTrainingRecords}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Evaluations</span>
                    <span className="text-lg font-bold text-gray-900">{stats.totalEvaluations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-lg font-bold text-gray-900">{stats.totalUsers}</span>
                  </div>
                </div>
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
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
