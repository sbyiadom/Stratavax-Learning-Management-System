import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { 
  BookOpen, Clock, Users, Search, GraduationCap,
  ArrowLeft, Grid, List, SlidersHorizontal, X
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

// Get unique categories from database
async function getCategories(supabase: any) {
  const { data } = await supabase
    .from('courses')
    .select('category')
    .eq('is_published', true)
    .in('slug', APPROVED_COURSE_SLUGS)
  
  if (!data) return []
  
  // Get unique categories
  const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))]
  return uniqueCategories
}

// Difficulty badges
const difficultyColors = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
}

interface PageProps {
  searchParams: {
    category?: string
    difficulty?: string
    search?: string
    view?: 'grid' | 'list'
  }
}

export default async function CoursesPage({ searchParams }: PageProps) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600 mb-6">Please log in to view courses.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .maybeSingle()

    // Get unique categories for filter
    const categories = await getCategories(supabase)

    // Build query
    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .in('slug', APPROVED_COURSE_SLUGS)
    
    // Apply category filter
    if (searchParams.category && searchParams.category !== 'all') {
      const decodedCategory = decodeURIComponent(searchParams.category)
      query = query.eq('category', decodedCategory)
    }
    
    // Apply difficulty filter
    if (searchParams.difficulty) {
      query = query.eq('difficulty_level', searchParams.difficulty)
    }
    
    // Apply search filter
    if (searchParams.search) {
      query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
    }
    
    // Order by featured first, then title
    query = query.order('is_featured', { ascending: false }).order('title')
    
    const { data: courses, error } = await query

    if (error) {
      console.error('Error fetching courses:', error)
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
            <p className="text-slate-600 mb-6">We encountered an error while loading this page. Please try again.</p>
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

    // Get user's enrolled courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)

    const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])

    const viewMode = searchParams.view || 'grid'
    const totalCourses = courses?.length || 0
    const currentCategory = searchParams.category && searchParams.category !== 'all'
      ? decodeURIComponent(searchParams.category)
      : 'all'

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Stratavax</h1>
                  <p className="text-xs text-slate-500">Learning Management System</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 hidden md:block">{user.email}</span>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {(profile?.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Course Catalog</h1>
            <p className="text-sm text-slate-600 mt-1">
              {totalCourses} course{totalCourses !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <form action="/dashboard/courses" method="GET" className="relative">
              {searchParams.category && searchParams.category !== 'all' && (
                <input type="hidden" name="category" value={searchParams.category} />
              )}
              {searchParams.difficulty && (
                <input type="hidden" name="difficulty" value={searchParams.difficulty} />
              )}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search courses, lessons..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </form>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Link
                href="/dashboard/courses"
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Courses
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/dashboard/courses?category=${encodeURIComponent(category)}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    currentCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, view: 'grid' } as any)}`}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-600'
                }`}
              >
                <Grid size={18} />
              </Link>
              <Link
                href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, view: 'list' } as any)}`}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-600'
                }`}
              >
                <List size={18} />
              </Link>
            </div>
          </div>

          {/* Active Filters */}
          {(searchParams.difficulty || searchParams.search) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchParams.difficulty && (
                <Link
                  href={`/dashboard/courses?${new URLSearchParams({
                    ...searchParams,
                    difficulty: '',
                  } as any)}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {searchParams.difficulty}
                  <X size={14} />
                </Link>
              )}
              {searchParams.search && (
                <Link
                  href={`/dashboard/courses?${new URLSearchParams({
                    ...searchParams,
                    search: '',
                  } as any)}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  "{searchParams.search}"
                  <X size={14} />
                </Link>
              )}
            </div>
          )}

          {/* Course Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                
                return (
                  <Link
                    key={course.id}
                    href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Course Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                      {course.is_featured && (
                        <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                      {isEnrolled && (
                        <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Enrolled
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center text-white text-4xl opacity-20">
                        📚
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        {course.difficulty_level && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            difficultyColors[course.difficulty_level as keyof typeof difficultyColors] || 'bg-slate-100 text-slate-700'
                          }`}>
                            {course.difficulty_level}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {course.category || 'General'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {course.short_description || course.description?.substring(0, 100) || 'No description available'}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {course.duration_hours || '?'}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {course.enrollment_count || 0}
                          </span>
                        </div>
                        <span className="text-blue-600 text-xs font-medium">
                          {isEnrolled ? 'Continue →' : 'View →'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {courses?.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                
                return (
                  <Link
                    key={course.id}
                    href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden flex"
                  >
                    <div className="w-24 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl opacity-80">
                      📚
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {course.difficulty_level && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                difficultyColors[course.difficulty_level as keyof typeof difficultyColors] || 'bg-slate-100 text-slate-700'
                              }`}>
                                {course.difficulty_level}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">{course.category || 'General'}</span>
                            {course.is_featured && (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 max-w-2xl">
                            {course.short_description || course.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{course.duration_hours || '?'}h</p>
                            <p className="text-xs text-slate-500">{course.enrollment_count || 0} students</p>
                          </div>
                          {isEnrolled ? (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm rounded-lg">
                              Enrolled
                            </span>
                          ) : (
                            <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                              View →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {(!courses || courses.length === 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-500 mb-6">
                {searchParams.search 
                  ? `No results match "${searchParams.search}"`
                  : 'No courses match your current filters.'}
              </p>
              <Link
                href="/dashboard/courses"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </Link>
            </div>
          )}

          {/* Admin Footer */}
          {profile?.role === 'admin' && (
            <div className="mt-12 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Admin</span>
                <Link
                  href="/admin/resources"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Manage Resources
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Courses page error:', error)
    
    // Fallback UI for any unexpected errors
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
          <p className="text-slate-600 mb-6">We encountered an error while loading this page. Please try again.</p>
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
