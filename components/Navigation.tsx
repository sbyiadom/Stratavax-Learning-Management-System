'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, 
  BarChart3, 
  BookOpen, 
  FileSpreadsheet, 
  Star, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  User,
  HelpCircle,
  Award
} from 'lucide-react'

interface NavigationProps {
  user: any
  isAdmin?: boolean
}

export default function Navigation({ user, isAdmin = false }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Helper to check if a tab is active based on URL params
  const isTabActive = (tabName: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('tab') === tabName
    }
    return false
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: pathname === '/dashboard' },
    { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen, current: pathname === '/dashboard/courses' },
  ]

  const adminItems = [
    { 
      name: 'Analytics Overview', 
      href: '/admin/reports', 
      icon: BarChart3, 
      current: pathname === '/admin/reports' && !isTabActive('training') && !isTabActive('evaluations') 
    },
    { 
      name: 'Training Records', 
      href: '/admin/reports?tab=training', 
      icon: FileSpreadsheet, 
      current: pathname === '/admin/reports' && isTabActive('training') 
    },
    { 
      name: 'Evaluations', 
      href: '/admin/reports?tab=evaluations', 
      icon: Star, 
      current: pathname === '/admin/reports' && isTabActive('evaluations') 
    },
  ]

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow transition">
                  <BarChart3 className="text-white" size={18} />
                </div>
                <span className="font-semibold text-gray-900">Stratavax LMS</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <item.icon size={16} />
                    {item.name}
                  </span>
                </Link>
              ))}
              
              {/* Admin Dropdown */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      pathname === '/admin/reports'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 size={16} />
                    Admin
                    <ChevronDown size={14} className={`transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {adminDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAdminDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        {adminItems.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => {
                              setAdminDropdownOpen(false)
                              router.push(item.href)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left ${
                              item.current
                                ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <item.icon size={16} className={item.current ? 'text-blue-600' : 'text-gray-400'} />
                            <span>{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Quick Action Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
                >
                  <FileSpreadsheet size={14} />
                  Training
                </a>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <FileSpreadsheet size={14} />
                  Request Course
                </a>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                    {userInitial}
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User size={14} />
                          Profile Settings
                        </Link>
                        <Link
                          href="/dashboard/help"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <HelpCircle size={14} />
                          Help & Support
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin/reports"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <BarChart3 size={14} />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <item.icon size={18} />
                    {item.name}
                  </span>
                </Link>
              ))}
              
              {isAdmin && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Admin
                  </div>
                  {adminItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block pl-9 pr-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon size={16} />
                        {item.name}
                      </span>
                    </Link>
                  ))}
                </>
              )}
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                      {userInitial}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <span className="flex items-center gap-2">
                      <User size={14} />
                      Profile Settings
                    </span>
                  </Link>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    📋 Training Registration
                  </a>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    ➕ Request Course
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut size={14} />
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16" />
    </>
  )
}
