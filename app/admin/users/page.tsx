'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Users, 
  Search, 
  ChevronDown, 
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  Crown,
  Star,
  User,
  Mail,
  Calendar,
  MoreVertical,
  Save,
  X
} from 'lucide-react'

type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

type RoleOption = {
  value: string
  label: string
  icon: typeof User
  color: string
  bgColor: string
}

const roleOptions: RoleOption[] = [
  { value: 'user', label: 'User', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { value: 'supervisor', label: 'Supervisor', icon: Star, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'admin', label: 'Admin', icon: Crown, color: 'text-red-600', bgColor: 'bg-red-100' }
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoadUsers()
  }, [refreshKey])

  const checkAdminAndLoadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      
      setCurrentUserId(user.id)
      await loadUsers()
    } catch (error) {
      console.error('Error checking admin:', error)
      router.push('/dashboard')
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      
      if (error) throw error
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      setShowConfirmModal(false)
      setSelectedUser(null)
      setShowRoleDropdown(null)
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
    setShowRoleDropdown(null)
  }

  const getRoleBadge = (role: string) => {
    const option = roleOptions.find(r => r.value === role)
    if (!option) return null
    
    const Icon = option.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${option.bgColor} ${option.color}`}>
        <Icon size={12} />
        {option.label}
      </span>
    )
  }

  const getRoleSelectOptions = (currentRole: string) => {
    return roleOptions.filter(option => option.value !== currentRole)
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage user roles and permissions</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <RefreshCw size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Admins</p>
                <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Crown size={20} className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Supervisors</p>
                <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'supervisor').length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Regular Users</p>
                <p className="text-2xl font-bold text-gray-600">{users.filter(u => u.role === 'user').length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <User size={20} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Change Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                          {user.first_name?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        {updatingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-500">Updating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              onChange={(e) => openRoleModal(user, e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer hover:border-blue-400 transition"
                            >
                              <option value="user">👤 User</option>
                              <option value="supervisor">⭐ Supervisor</option>
                              <option value="admin">👑 Admin</option>
                            </select>
                            {user.id === currentUserId && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
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
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 text-sm hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Role Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">User</p>
                <p className="text-xs text-gray-500">Can take courses, fill training register, and view reports</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Supervisor</p>
                <p className="text-xs text-gray-500">Can manually input evaluation data and manage reports</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown size={16} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">Full system access including user management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Role Change Modal */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Role Change</h3>
                <p className="text-sm text-gray-500">This action will affect user permissions</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Change role for <span className="font-semibold text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</span>
              </p>
              <div className="flex items-center justify-between py-2 border-t border-gray-200">
                <span className="text-sm text-gray-500">Current role:</span>
                {getRoleBadge(selectedUser.role)}
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-200">
                <span className="text-sm text-gray-500">New role:</span>
                {getRoleBadge(newRole)}
              </div>
            </div>
            
            {newRole === 'admin' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Admin users have full access to all features including user management and system settings.</span>
                </p>
              </div>
            )}
            
            {newRole === 'supervisor' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <Star size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Supervisors can manually input evaluation data and manage reports.</span>
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedUser(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRoleChange(selectedUser.id, newRole)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
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
