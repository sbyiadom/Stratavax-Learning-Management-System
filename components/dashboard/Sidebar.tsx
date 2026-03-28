'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase' // ← Use browser client, NOT supabase-server

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'blue' },
  { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen, color: 'green' },
  { name: 'Explore', href: '/dashboard/explore', icon: Compass, color: 'purple' },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp, color: 'orange' },
  { name: 'Assignments', href: '/dashboard/assignments', icon: FileText, color: 'indigo' },
  { name: 'Community', href: '/dashboard/community', icon: Users, color: 'pink' },
  { name: 'Certificates', href: '/dashboard/certificates', icon: Award, color: 'yellow' },
  { name: 'Reports', href: '/admin/reports', icon: FileSpreadsheet, color: 'teal' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'gray' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)
    }
    getUser()
  }, [supabase])

  // Admin email - update to your email
  const ADMIN_EMAIL = 'sbyiadom88@gmail.com'
  const isAdmin = userEmail === ADMIN_EMAIL

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

  return (
    <div 
      className={cn(
        "bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 h-screen sticky top-0 shadow-xl",
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        {!collapsed && (
          <div className="px-4 pt-6 pb-4 mb-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                <GraduationCap className="text-white" size={18} />
              </div>
              <span className="font-semibold text-white">StrataVax</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
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
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
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
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Admin Section */}
        {isAdmin && (
          <div className="px-3 pt-4 pb-2 border-t border-gray-700">
            {!collapsed && (
              <div className="px-3 mb-2 flex items-center gap-2">
                <Shield className="h-3 w-3 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Administration
                </span>
              </div>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/admin/resources"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                    collapsed && 'justify-center'
                  )}
                >
                  <Database className={cn(
                    "h-5 w-5 transition-colors",
                    collapsed ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-400'
                  )} />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">Manage Resources</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/upload"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-300 hover:bg-gray-700 hover:text-white group",
                    collapsed && 'justify-center'
                  )}
                >
                  <Upload className={cn(
                    "h-5 w-5 transition-colors",
                    collapsed ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-400'
                  )} />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">Upload Content</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-700 mt-auto">
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center w-full py-2.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all mb-2",
              collapsed ? 'justify-center' : 'px-3'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3 text-sm">Sign out</span>}
          </button>
          
          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center w-full py-2.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all",
              collapsed ? 'justify-center' : 'px-3'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 text-sm">Collapse menu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
