import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, ArrowLeft, GraduationCap, AlertCircle } from 'lucide-react'

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

export default async function DashboardCoursesPage() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600 mb-6">Please log in to view courses.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Simple query - no joins, no complex filters
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .in('slug', APPROVED_COURSE_SLUGS)
      .order('is_featured', { ascending: false })
      .order('title')

    if (error) {
      console.error('Error fetching courses:', error)
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Courses</h2>
            <p className="text-slate-600 mb-6">
              There was a problem loading the course catalog. Please try again.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      )
    }

    // Get user's enrolled courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)

    const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <GraduationCap className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Stratavax</h1>
                    <p className="text-xs text-slate-500">Learning Management System</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-slate-900">Welcome back,</p>
                  <p className="text-sm text-blue-600 font-semibold">
                    {profile?.name || user.email?.split('@')[0] || 'Learner'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(profile?.name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Course Catalog</h1>
            <p className="text-slate-600 mt-2">
              Explore our curated collection of courses designed to advance your career
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{courses?.length || 0}</p>
                  <p className="text-sm text-slate-600">Total Courses</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{enrolledCourseIds.size}</p>
                  <p className="text-sm text-slate-600">Enrolled</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {courses?.filter(c => c.is_featured).length || 0}
                  </p>
                  <p className="text-sm text-slate-600">Featured</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          {!courses || courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Courses Available</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Courses will appear here once they are added to the system.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                
                return (
                  <Link
                    key={course.id}
                    href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Course Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                      {course.is_featured && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                      {isEnrolled && (
                        <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Enrolled
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center text-white text-4xl opacity-20">
                        📚
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {course.difficulty_level || 'All Levels'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {course.category || 'General'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {course.short_description || course.description?.substring(0, 100) || 'No description available'}
                      </p>

                      {/* Course Stats */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {course.duration_hours || '?'}h
                        </span>
                        <span className="flex items-center gap-1">
                          👥 {course.enrollment_count || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard courses error:', error)
    
    // Fallback UI for any unexpected errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
          <p className="text-slate-600 mb-6">
            We encountered an error while loading this page. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <form>
              <button
                type="submit"
                formAction={async () => {
                  'use server'
                  // This will refresh the page
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Try again
              </button>
            </form>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
