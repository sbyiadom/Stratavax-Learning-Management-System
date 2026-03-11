'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Award, 
  Users, 
  CheckCircle,
  Home,
  GraduationCap,
  BarChart3,
  Settings,
  Bell,
  Search,
  PlayCircle,
  Star,
  Trophy,
  LogOut,
  Menu,
  X,
  FileText,
  Target,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  Share2,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react'

// Approved course slugs
const APPROVED_COURSE_SLUGS = [
  'electrical-engineering',
  'microsoft-office',
  'programming-fundamentals',
  'web-development',
  'data-analysis',
  'ai-fundamentals',
  'entrepreneurship-pathway',
  'financial-literacy',
  'business-model-design',
  'business-plan-development',
  'marketing-sales',
  'digital-marketing',
  'business-growth-strategy',
  'leadership',
  'basic-mechanical-engineering'
]

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  category: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
  duration_hours: number | null
  enrollment_count: number | null
  is_featured: boolean | null
}

type Enrollment = {
  course_id: string
  progress_percentage: number
  status: string
  completed_at: string | null
  enrolled_at: string | null
  course: Course
}

type UserProfile = {
  id: string
  full_name: string
  email: string
  department: string | null
  role: string | null
  avatar_url: string | null
  total_points: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }

      // Fetch all approved courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .in('slug', APPROVED_COURSE_SLUGS)
        .order('title')

      if (courses) {
        setAllCourses(courses)
      }

      // Fetch user enrollments with course details
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          progress_percentage,
          status,
          completed_at,
          enrolled_at,
          course:courses!inner(*)
        `)
        .eq('user_id', user.id)
        .in('course.slug', APPROVED_COURSE_SLUGS)
        .order('enrolled_at', { ascending: false })

      if (enrollmentsData) {
        const transformedEnrollments: Enrollment[] = enrollmentsData.map((item: any) => ({
          course_id: item.course_id,
          progress_percentage: item.progress_percentage,
          status: item.status,
          completed_at: item.completed_at,
          enrolled_at: item.enrolled_at,
          course: Array.isArray(item.course) ? item.course[0] : item.course
        }))
        
        setEnrollments(transformedEnrollments)
      }

      setLoading(false)
    }

    loadUserData()
  }, [supabase])

  const handleEnroll = async (courseId: string, courseSlug: string) => {
    if (!user) return
    
    await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      progress_percentage: 0
    })
    
    router.push(`/dashboard/learn/${courseSlug}`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Stratavax Learning...</p>
        </div>
      </div>
    )
  }

  // Calculate real stats from enrollments
  const totalEnrolled = enrollments.length
  const inProgress = enrollments.filter(e => e.status === 'active' && !e.completed_at && e.progress_percentage > 0).length
  const notStarted = enrollments.filter(e => e.status === 'active' && e.progress_percentage === 0).length
  const completed = enrollments.filter(e => e.completed_at).length
  
  const enrolledCourseIds = enrollments.map(e => e.course_id)
  const inProgressCourses = enrollments.filter(e => e.status === 'active' && !e.completed_at && e.progress_percentage > 0)
  const completedCourses = enrollments.filter(e => e.completed_at)

  // Get display name
  const displayName = userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner'
  const userInitial = userProfile?.full_name?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar - Fixed */}
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
                <GraduationCap className="text-white" size={18} />
              </div>
              <span className="font-semibold text-gray-900">Stratavax Learning</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5">
              <Search size={18} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="bg-transparent border-none focus:outline-none ml-2 text-sm w-64"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <HelpCircle size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {userInitial}
              </div>
              <span className="text-sm font-medium hidden md:block">{displayName}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
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
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
                <LayoutDashboard size={20} />
                <span className="text-sm font-medium">Overview</span>
              </Link>
              <Link href="/dashboard/courses" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
                <BookOpen size={20} />
                <span className="text-sm">Course Catalogue</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Fixed position */}
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
            <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-md bg-blue-50 text-blue-600">
              <LayoutDashboard size={20} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Overview</span>}
            </Link>
            <Link href="/dashboard/courses" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <BookOpen size={20} />
              {!sidebarCollapsed && <span className="text-sm">Course Catalogue</span>}
            </Link>
            <Link href="/dashboard/training" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Target size={20} />
              {!sidebarCollapsed && <span className="text-sm">Training Plans</span>}
            </Link>
            <Link href="/dashboard/certificates" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Award size={20} />
              {!sidebarCollapsed && <span className="text-sm">Certificates</span>}
            </Link>
            <Link href="/dashboard/skills" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Star size={20} />
              {!sidebarCollapsed && <span className="text-sm">Skills</span>}
            </Link>
            <Link href="/dashboard/transcript" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <FileText size={20} />
              {!sidebarCollapsed && <span className="text-sm">Transcript</span>}
            </Link>
            <Link href="/dashboard/leaderboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Trophy size={20} />
              {!sidebarCollapsed && <span className="text-sm">Leaderboard</span>}
            </Link>

            <div className="border-t my-4"></div>

            <Link href="/dashboard/manager" className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-600 hover:bg-gray-100">
              <Users size={20} />
              {!sidebarCollapsed && <span className="text-sm">Line Manager</span>}
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

      {/* Main Content - Takes full width with padding for sidebar */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="p-4 sm:p-6 w-full">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <span>Stratavax Learning</span>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-gray-900">Dashboard</span>
          </div>

          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {displayName}! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {userProfile?.department ? `${userProfile.department} • ` : ''}
                {totalEnrolled} {totalEnrolled === 1 ? 'course' : 'courses'} in progress
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Download size={16} />
                <span>Export</span>
              </button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Stats Cards - Full width grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <BookOpen className="text-blue-600" size={22} />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{totalEnrolled}</h3>
              <p className="text-sm text-gray-500">Enrolled Courses</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-yellow-100 rounded-lg">
                  <Clock className="text-yellow-600" size={22} />
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Active</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{inProgress}</h3>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600" size={22} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Done</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{completed}</h3>
              <p className="text-sm text-gray-500">Completed</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <Trophy className="text-purple-600" size={22} />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Points</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{userProfile?.total_points || 0}</h3>
              <p className="text-sm text-gray-500">Learning Points</p>
            </div>
          </div>

          {/* Two Column Layout - Full width proportionally */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {/* Left Column - Takes 2/3 of available width */}
            <div className="lg:col-span-2 space-y-6 w-full">
              {/* Enrollment Status */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Learning Progress</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl font-bold text-gray-700">{notStarted}</span>
                    <p className="text-xs text-gray-500 mt-1">Not Started</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-2xl font-bold text-yellow-600">{inProgress}</span>
                    <p className="text-xs text-gray-500 mt-1">In Progress</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <span className="text-2xl font-bold text-green-600">{completed}</span>
                    <p className="text-xs text-gray-500 mt-1">Completed</p>
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-3 mt-4 w-full">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Not Started</span>
                      <span className="font-medium">{notStarted} courses</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                      <div className="h-2 bg-gray-400 rounded-full" style={{ width: totalEnrolled ? `${(notStarted/totalEnrolled)*100}%` : '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-medium">{inProgress} courses</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                      <div className="h-2 bg-yellow-500 rounded-full" style={{ width: totalEnrolled ? `${(inProgress/totalEnrolled)*100}%` : '0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">{completed} courses</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: totalEnrolled ? `${(completed/totalEnrolled)*100}%` : '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Learning Section */}
              {inProgressCourses.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Continue Learning</h3>
                    <Link href="/dashboard/my-courses" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                      View all <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </div>
                  
                  <div className="space-y-4 w-full">
                    {inProgressCourses.slice(0, 3).map((enrollment) => (
                      <div key={enrollment.course_id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition w-full">
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <BookOpen className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{enrollment.course.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{enrollment.course.duration_hours || 0} hours total</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-blue-600">{enrollment.progress_percentage}%</span>
                        </div>
                        <div className="mt-3 w-full">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                            <div className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                          </div>
                          <button
                            onClick={() => router.push(`/dashboard/learn/${enrollment.course.slug}`)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                          >
                            Continue <ChevronRight size={14} className="ml-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Courses */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                  <Link href="/dashboard/courses" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                    Browse all <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {allCourses.filter(c => !enrolledCourseIds.includes(c.id)).slice(0, 4).map((course) => (
                    <div key={course.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition w-full">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                          <BookOpen className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{course.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{course.duration_hours || 0} hours</p>
                          <button
                            onClick={() => handleEnroll(course.id, course.slug)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Enroll Now →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Takes 1/3 of available width */}
            <div className="space-y-6 w-full">
              {/* Recent Achievements */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
                <div className="space-y-4 w-full">
                  {completedCourses.slice(0, 3).map((enrollment, idx) => (
                    <div key={idx} className="flex items-center space-x-3 w-full">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                        🏆
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{enrollment.course.title}</p>
                        <p className="text-xs text-gray-500">
                          Completed {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {completedCourses.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Complete a course to earn achievements!</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-6 text-white w-full">
                <h3 className="text-lg font-semibold mb-2">Ready to learn more?</h3>
                <p className="text-sm text-blue-100 mb-4">Browse our catalog of {allCourses.length}+ courses</p>
                <Link 
                  href="/dashboard/courses" 
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Explore Courses
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>

              {/* Profile Summary */}
              {userProfile && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 w-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
                  <div className="space-y-3 w-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {userInitial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userProfile.full_name}</p>
                        <p className="text-xs text-gray-500">{userProfile.email}</p>
                      </div>
                    </div>
                    {userProfile.department && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-medium">{userProfile.department}</p>
                      </div>
                    )}
                    {userProfile.role && (
                      <div>
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-sm font-medium">{userProfile.role}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
