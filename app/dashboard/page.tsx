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
  TrendingUp, 
  CheckCircle,
  Home,
  Layout,
  GraduationCap,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  PlayCircle,
  Star,
  Sparkles
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
  course: Course
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalHours: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  
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

      // Fetch approved courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .in('slug', APPROVED_COURSE_SLUGS)
        .order('is_featured', { ascending: false })
        .order('title')

      if (courses) {
        setAllCourses(courses)
        
        const uniqueCategories = Array.from(
          new Set(courses.map(c => c.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      }

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          progress_percentage,
          status,
          completed_at,
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
          course: Array.isArray(item.course) ? item.course[0] : item.course
        }))
        
        setEnrollments(transformedEnrollments)

        // Calculate stats
        const completedCourses = transformedEnrollments.filter(e => e.completed_at).length
        const enrolledCourseIds = transformedEnrollments.map(e => e.course_id)
        
        let totalLessons = 0
        let completedLessons = 0
        let totalHours = 0

        if (enrolledCourseIds.length > 0) {
          const { data: modules } = await supabase
            .from('modules')
            .select('id, estimated_minutes')
            .in('course_id', enrolledCourseIds)

          if (modules) {
            totalHours = Math.round(modules.reduce((acc, m) => acc + (m.estimated_minutes || 0), 0) / 60)
            
            const moduleIds = modules.map(m => m.id)
            
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds)
              .eq('is_published', true)

            if (lessons) {
              totalLessons = lessons.length
              
              const { data: completed } = await supabase
                .from('lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('completed', true)
                .in('lesson_id', lessons.map(l => l.id))

              completedLessons = completed?.length || 0
            }
          }
        }

        setStats({
          totalEnrolled: transformedEnrollments.length,
          completedCourses,
          totalLessons,
          completedLessons,
          totalHours
        })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    )
  }

  const enrolledCourseIds = enrollments.map(e => e.course_id)
  
  const filteredCourses = (searchQuery
    ? allCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : allCourses
  ).filter(c => selectedCategory === 'all' || c.category === selectedCategory)

  const inProgressCourses = enrollments.filter(e => e.status === 'active')
  const recommendedCourses = allCourses.filter(c => !enrolledCourseIds.includes(c.id)).slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white" size={20} />
                </div>
                <span className="font-bold text-xl text-gray-900">Stratavax Learning</span>
              </div>
              
              {/* Main Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link href="/dashboard" className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
                  Home
                </Link>
                <Link href="/dashboard/courses" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Course Catalogue
                </Link>
                <Link href="/dashboard/progress" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  My Training
                </Link>
                <Link href="/dashboard/community" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Community
                </Link>
              </nav>
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Continue your learning journey. You have {stats.totalEnrolled} courses in progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="text-blue-600" size={24} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalEnrolled}</h3>
            <p className="text-sm text-gray-600">Enrolled Courses</p>
            <div className="mt-4 h-1 bg-gray-100 rounded-full">
              <div className="h-1 bg-blue-600 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.completedLessons}/{stats.totalLessons}</h3>
            <p className="text-sm text-gray-600">Lessons Completed</p>
            <div className="mt-4 h-1 bg-gray-100 rounded-full">
              <div className="h-1 bg-green-600 rounded-full" style={{ width: `${stats.totalLessons ? (stats.completedLessons/stats.totalLessons)*100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.completedCourses}</h3>
            <p className="text-sm text-gray-600">Completed Courses</p>
            <div className="mt-4 h-1 bg-gray-100 rounded-full">
              <div className="h-1 bg-purple-600 rounded-full" style={{ width: `${stats.totalEnrolled ? (stats.completedCourses/stats.totalEnrolled)*100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalHours}h</h3>
            <p className="text-sm text-gray-600">Learning Time</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/courses" className="group bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <BookOpen size={32} />
              <ChevronRight size={20} className="group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-xl font-bold mb-2">Browse Course Catalogue</h3>
            <p className="text-blue-100">Explore {allCourses.length}+ courses in various disciplines</p>
          </Link>

          <Link href="/dashboard/explore" className="group bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="text-blue-600" size={32} />
              <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Discover New Skills</h3>
            <p className="text-gray-600">Find personalized recommendations based on your interests</p>
          </Link>
        </div>

        {/* Continue Learning Section */}
        {inProgressCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
              <Link href="/dashboard/my-courses" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressCourses.slice(0, 3).map((enrollment) => (
                <div key={enrollment.course_id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                  <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                    {enrollment.course.thumbnail_url ? (
                      <img src={enrollment.course.thumbnail_url} alt={enrollment.course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={48} className="text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition"></div>
                    <PlayCircle className="absolute bottom-3 right-3 text-white opacity-75 group-hover:opacity-100 transition" size={32} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {enrollment.course.difficulty_level || 'Beginner'}
                      </span>
                      {enrollment.course.category && (
                        <span className="text-xs text-gray-500">{enrollment.course.category.split(' ')[0]}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{enrollment.course.title}</h3>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-blue-600">{enrollment.progress_percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/learn/${enrollment.course.slug}`)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium"
                    >
                      Continue Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended For You */}
        {recommendedCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
                <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded-full">Personalized</span>
              </div>
              <Link href="/dashboard/explore" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                  <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-600 relative">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="text-white opacity-50" size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        {course.difficulty_level || 'Beginner'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.short_description || course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{course.duration_hours || 0} hours</span>
                      <button
                        onClick={() => handleEnroll(course.id, course.slug)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browse All Courses */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Browse All Courses</h2>
            
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id)
              const enrollment = enrollments.find(e => e.course_id === course.id)
              
              return (
                <div key={course.id} className="border border-gray-100 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                      <BookOpen className="text-blue-600" size={24} />
                    </div>
                    {isEnrolled && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Enrolled</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.short_description || course.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {course.duration_hours || 0}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.enrollment_count || 0}
                    </span>
                  </div>
                  {isEnrolled ? (
                    <button
                      onClick={() => router.push(`/dashboard/learn/${course.slug}`)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      {enrollment?.progress_percentage === 100 ? 'Review Course' : 'Continue'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id, course.slug)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
