'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  Compass, 
  BarChart3, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Shield,
  Database,
  Upload,
  FileSpreadsheet,
  Award,
  TrendingUp,
  LogOut,
  ClipboardList,
  CheckSquare,
  UserCog,
  Edit3,
  Eye,
  ArrowLeft
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'blue', roles: ['user', 'supervisor', 'admin'] },
  { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen, color: 'green', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Training Register', href: '/dashboard/training', icon: ClipboardList, color: 'indigo', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Course Evaluation', href: '/dashboard/evaluation', icon: CheckSquare, color: 'teal', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Explore', href: '/dashboard/explore', icon: Compass, color: 'purple', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp, color: 'orange', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Assignments', href: '/dashboard/assignments', icon: FileText, color: 'indigo', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Community', href: '/dashboard/community', icon: Users, color: 'pink', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Certificates', href: '/dashboard/certificates', icon: Award, color: 'yellow', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: Eye, color: 'teal', roles: ['user', 'supervisor', 'admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'gray', roles: ['user', 'supervisor', 'admin'] },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          setLoading(false)
          return
        }
        
        setUserEmail(user.email || null)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profile) {
          setUserRole(profile.role || 'user')
          setUserName(profile.first_name || user.email?.split('@')[0] || null)
        } else {
          setUserRole('user')
          setUserName(user.email?.split('@')[0] || null)
        }
        
      } catch (error) {
        console.error('Error in getUserProfile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getUserProfile()
  }, [supabase])

  const isAdmin = userRole === 'admin'
  const isSupervisor = userRole === 'supervisor' || isAdmin

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth') || key.includes('token'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      sessionStorage.clear()
      
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const [name] = cookie.split('=')
        const trimmedName = name.trim()
        if (trimmedName.includes('supabase') || trimmedName.includes('sb-') || trimmedName.includes('auth')) {
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        }
      })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.replace('/login')
      
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.replace('/login')
    }
  }

  const goBack = () => {
    router.back()
  }

  const getActiveStyles = (isActive: boolean, color: string) => {
    if (!isActive) return ''
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-l-4 border-blue-600',
      green: 'bg-green-50 text-green-700 border-l-4 border-green-600',
      purple: 'bg-purple-50 text-purple-700 border-l-4 border-purple-600',
      orange: 'bg-orange-50 text-orange-700 border-l-4 border-orange-600',
      indigo: 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600',
      pink: 'bg-pink-50 text-pink-700 border-l-4 border-pink-600',
      yellow: 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-600',
      teal: 'bg-teal-50 text-teal-700 border-l-4 border-teal-600',
      gray: 'bg-gray-100 text-gray-800 border-l-4 border-gray-500',
    }
    return colorMap[color] || 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
  }

  const getIconColor = (isActive: boolean, color: string) => {
    if (isActive) return ''
    const colorMap: Record<string, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      orange: 'text-orange-500',
      indigo: 'text-indigo-500',
      pink: 'text-pink-500',
      yellow: 'text-yellow-600',
      teal: 'text-teal-500',
      gray: 'text-gray-500',
    }
    return colorMap[color] || 'text-gray-500'
  }

  const displayName = userName || userEmail?.split('@')[0] || 'User'
  
  const getRoleBadgeClass = () => {
    switch(userRole) {
      case 'admin': return 'bg-red-500/20 text-red-300'
      case 'supervisor': return 'bg-blue-500/20 text-blue-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getRoleDisplay = () => {
    switch(userRole) {
      case 'admin': return 'Admin'
      case 'supervisor': return 'Supervisor'
      default: return 'User'
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 h-screen sticky top-0 shadow-xl",
        collapsed ? 'w-20' : 'w-64'
      )}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 h-screen sticky top-0 shadow-xl flex flex-col",
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="flex-shrink-0">
        {!collapsed && (
          <div className="px-4 pt-5 pb-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                  <GraduationCap className="text-white" size={18} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-white">Stratavax</span>
                  <span className="text-xs font-medium text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-full">LMS</span>
                </div>
              </div>
              {/* Back Button */}
              <button
                onClick={goBack}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="px-2 pt-5 pb-3 border-b border-gray-700 flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="text-white" size={18} />
            </div>
            <button
              onClick={goBack}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft size={14} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* User Info Area */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className={`text-xs ${getRoleBadgeClass()} rounded-full px-2 py-0.5 inline-block mt-0.5`}>
                  {getRoleDisplay()}
                </p>
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="px-2 py-3 border-b border-gray-700 flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <nav className={cn("px-3 py-4", collapsed && "px-2")}>
          {/* Main Navigation */}
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (!item.roles.includes(userRole || 'user')) return null
              
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const activeStyles = getActiveStyles(isActive, item.color)
              const iconColor = getIconColor(isActive, item.color)
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-all duration-200 group",
                      isActive 
                        ? activeStyles
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      isActive ? 'text-current' : iconColor,
                      !isActive && 'group-hover:text-white'
                    )} />
                    {!collapsed && (
                      <span className={cn(
                        "ml-3 text-sm font-medium",
                        isActive ? 'text-current' : 'text-gray-300'
                      )}>
                        {item.name}
                      </span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Evaluation Reporting Section - ONLY for Supervisors and Admins */}
          {(isSupervisor || isAdmin) && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              {!collapsed && (
                <div className="px-3 mb-2 flex items-center gap-2">
                  <Edit3 className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                    Evaluation Management
                  </span>
                </div>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/dashboard/evaluation-reports"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <FileSpreadsheet className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      collapsed ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
                    )} />
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">Manual Data Entry</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                        Manual Data Entry
                      </div>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Admin Section - ONLY for Admins */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              {!collapsed && (
                <div className="px-3 mb-2 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                    System Administration
                  </span>
                </div>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin/users"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <UserCog className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      collapsed ? 'text-red-400' : 'text-gray-400 group-hover:text-red-400'
                    )} />
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">User Management</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                        User Management
                      </div>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/reports?tab=analytics"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <BarChart3 className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      collapsed ? 'text-red-400' : 'text-gray-400 group-hover:text-red-400'
                    )} />
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">Analytics</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                        Analytics
                      </div>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/reports?tab=training"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <FileText className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      collapsed ? 'text-red-400' : 'text-gray-400 group-hover:text-red-400'
                    )} />
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">Training Records</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                        Training Records
                      </div>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/reports?tab=evaluations"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Award className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      collapsed ? 'text-red-400' : 'text-gray-400 group-hover:text-red-400'
                    )} />
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">Evaluations</span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                        Evaluations
                      </div>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className="flex-shrink-0 p-3 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            "flex items-center w-full py-2.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all mb-2 group",
            collapsed ? 'justify-center' : 'px-3',
            isSigningOut && 'opacity-50 cursor-not-allowed'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className="ml-3 text-sm">
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </div>
          )}
        </button>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center w-full py-2.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all group",
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          {collapsed ? (
            <>
              <ChevronRight className="h-5 w-5 flex-shrink-0" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                Expand menu
              </div>
            </>
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
              <span className="ml-2 text-sm">Collapse menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
