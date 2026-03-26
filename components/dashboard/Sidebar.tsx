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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Shield,
  Database,
  Upload,
  FileSpreadsheet
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Explore', href: '/dashboard/explore', icon: Compass },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
  { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
  { name: 'Community', href: '/dashboard/community', icon: Users },
  { name: 'Certificates', href: '/dashboard/certificates', icon: GraduationCap },
  { name: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
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

  return (
    <div 
      className={cn(
        "bg-white border-r transition-all duration-300 h-[calc(100vh-73px)] sticky top-[73px]",
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 transition-colors",
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      isActive ? 'text-blue-700' : 'text-gray-500'
                    )} />
                    {!collapsed && (
                      <span className="ml-3 font-medium">{item.name}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Admin Section - Only visible to admin */}
        {isAdmin && (
          <div className="px-4 pt-4 border-t">
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </h3>
            )}
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard/admin/resources"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 transition-colors text-gray-700 hover:bg-gray-100",
                    collapsed && 'justify-center'
                  )}
                >
                  <Database className="h-5 w-5 text-gray-500" />
                  {!collapsed && (
                    <span className="ml-3 font-medium">Manage Resources</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/upload"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 transition-colors text-gray-700 hover:bg-gray-100",
                    collapsed && 'justify-center'
                  )}
                >
                  <Upload className="h-5 w-5 text-gray-500" />
                  {!collapsed && (
                    <span className="ml-3 font-medium">Upload Content</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Bottom Section */}
        <div className="p-4 border-t mt-auto">
          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center w-full py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors",
              collapsed ? 'justify-center' : 'px-3'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
