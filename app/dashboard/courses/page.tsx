import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { 
  BookOpen, Clock, Users, Search, Filter, 
  Grid, List, SlidersHorizontal, ChevronRight,
  Star, TrendingUp, Award, GraduationCap,
  Sparkles, Target, CheckCircle, X,
  ArrowLeft
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

// Categories matching your database exactly
const categories = [
  { id: 'all', name: 'All Courses', color: 'bg-gray-600' },
  { id: 'Business & Entrepreneurship', name: '🚀 Business & Entrepreneurship', color: 'bg-green-600' },
  { id: 'Data Science & AI', name: '🤖 Data Science & AI', color: 'bg-indigo-600' },
  { id: 'Digital & Technology Skills', name: '💻 Digital & Technology', color: 'bg-blue-600' },
  { id: 'Engineering & Technical Skills', name: '⚙️ Engineering', color: 'bg-orange-600' },
  { id: 'Financial Literacy', name: '💰 Financial Literacy', color: 'bg-emerald-600' },
  { id: 'Leadership & Personal Development', name: '🌟 Leadership', color: 'bg-purple-600' },
  { id: 'Programming & Development', name: '👨‍💻 Programming', color: 'bg-pink-600' },
  { id: 'Web Development', name: '🌐 Web Development', color: 'bg-cyan-600' },
]

// Difficulty level badges
const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
}

export default async function DashboardCoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; difficulty?: string; search?: string }
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // Let middleware handle redirect
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single()
  
  // Build category counts from your data
  const categoryCounts = {
    'Business & Entrepreneurship': 6,
    'Data Science & AI': 2,
    'Digital & Technology Skills': 1,
    'Engineering & Technical Skills': 2,
    'Financial Literacy': 1,
    'Leadership & Personal Development': 1,
    'Programming & Development': 1,
    'Web Development': 1,
  }
  
  const totalCourses = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  
  // Build query - Start with approved courses only
  let query = supabase
    .from('courses')
    .select(`
      *,
      enrollments!left(user_id, course_id)
    `)
    .eq('is_published', true)
    .in('slug', APPROVED_COURSE_SLUGS)
  
  // Apply category filter - with proper decoding
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
  
  // Order by featured first, then by title
  query = query.order('is_featured', { ascending: false }).order('title')
  
  const { data: courses, error } = await query

  if (error) {
    console.error('Error fetching courses:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Courses</h2>
          <p className="text-gray-600 mb-6">There was an error loading the course catalog.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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

  // Get current category for display
  const currentCategory = searchParams.category && searchParams.category !== 'all'
    ? decodeURIComponent(searchParams.category)
    : 'all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Stratavax Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <GraduationCap className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Stratavax
                  </h1>
                  <p className="text-xs text-gray-500">Learning Management System</p>
                </div>
              </div>
            </div>

            {/* User Welcome */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">Welcome back,</p>
                <p className="text-sm text-blue-600 font-semibold">
                  {profile?.first_name || profile?.last_name || user.email?.split('@')[0]}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {(profile?.first_name?.[0] || user.email?.charAt(0) || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
          <p className="text-gray-600 mt-2">
            {currentCategory === 'all' 
              ? `Browse all ${totalCourses} courses` 
              : `${categories.find(c => c.id === currentCategory)?.name || currentCategory} • ${courses?.length || 0} courses`}
          </p>
        </div>

        {/* Search Bar - Prominently placed */}
        <div className="mb-8">
          <form className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search courses by title, description, or topic..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Professional Cards */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-blue-600" />
                  Filters
                </h2>
                {(searchParams.category || searchParams.difficulty || searchParams.search) && (
                  <Link
                    href="/dashboard/courses"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear all
                  </Link>
                )}
              </div>

              {/* Category Filter with improved visuals */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                <div className="space-y-1">
                  {/* All Courses - with total count */}
                  <Link
                    href="/dashboard/courses"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      currentCategory === 'all'
                        ? 'bg-gray-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">📚</span>
                    <span className="flex-1 font-medium">All Courses</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentCategory === 'all'
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {totalCourses}
                    </span>
                  </Link>

                  {/* Category List with individual counts */}
                  {categories.filter(c => c.id !== 'all').map((category) => {
                    const count = categoryCounts[category.id as keyof typeof categoryCounts] || 0
                    const isActive = currentCategory === category.id
                    
                    return (
                      <Link
                        key={category.id}
                        href={`/dashboard/courses?category=${encodeURIComponent(category.id)}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                          isActive
                            ? `${category.color} text-white shadow-md`
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">{category.name.split(' ')[0]}</span>
                        <span className="flex-1 font-medium">{category.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? 'bg-white bg-opacity-20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                        {isActive && (
                          <ChevronRight size={16} className="text-white opacity-70" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Difficulty</h3>
                <div className="flex flex-col gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => {
                    const params = new URLSearchParams(searchParams)
                    if (searchParams.difficulty === level) {
                      params.delete('difficulty')
                    } else {
                      params.set('difficulty', level)
                    }
                    if (searchParams.category && searchParams.category !== 'all') {
                      params.set('category', searchParams.category)
                    }
                    
                    return (
                      <Link
                        key={level}
                        href={`/dashboard/courses?${params.toString()}`}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm capitalize transition ${
                          searchParams.difficulty === level
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>{level}</span>
                        {searchParams.difficulty === level && (
                          <CheckCircle size={16} className="text-white/80" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Active Filters Summary */}
              {(searchParams.difficulty || searchParams.search) && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Active Filters</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchParams.difficulty && (
                      <Link
                        href={`/dashboard/courses?${new URLSearchParams({
                          ...searchParams,
                          difficulty: '',
                        } as any)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
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
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                      >
                        "{searchParams.search}"
                        <X size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{courses?.length || 0}</span> of{' '}
                <span className="font-medium text-gray-900">{totalCourses}</span> courses
              </p>
              
              {/* Sort Dropdown */}
              <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>Sort by: Featured</option>
                <option>Sort by: Title A-Z</option>
                <option>Sort by: Most Popular</option>
                <option>Sort by: Newest</option>
              </select>
            </div>

            {/* Course Grid - Professional Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                
                return (
                  <Link
                    key={course.id}
                    href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200"
                  >
                    {/* Course Image with Gradient */}
                    <div className="h-40 bg-gradient-to-br from-blue-600 to-purple-600 relative">
                      {/* Category Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
                          {course.category === 'Business & Entrepreneurship' && '🚀'}
                          {course.category === 'Data Science & AI' && '🤖'}
                          {course.category === 'Digital & Technology Skills' && '💻'}
                          {course.category === 'Engineering & Technical Skills' && '⚙️'}
                          {course.category === 'Financial Literacy' && '💰'}
                          {course.category === 'Leadership & Personal Development' && '🌟'}
                          {course.category === 'Programming & Development' && '👨‍💻'}
                          {course.category === 'Web Development' && '🌐'}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {course.is_featured && (
                          <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Star size={12} />
                            Featured
                          </span>
                        )}
                        {isEnrolled && (
                          <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <CheckCircle size={12} />
                            Enrolled
                          </span>
                        )}
                      </div>

                      {/* Difficulty Badge */}
                      {course.difficulty_level && (
                        <div className="absolute bottom-3 left-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border border-white/20 backdrop-blur-sm ${
                            difficultyColors[course.difficulty_level as keyof typeof difficultyColors]
                          }`}>
                            {course.difficulty_level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {course.category?.split(' ')[0] || 'Course'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.short_description || course.description?.substring(0, 100) || 'No description available'}
                      </p>

                      {/* Course Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {course.duration_hours || '?'}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {course.enrollment_count || 0}
                          </span>
                        </div>
                        <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          {isEnrolled ? 'Continue →' : 'Explore →'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* No Results */}
            {(!courses || courses.length === 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchParams.search 
                    ? `No courses match "${searchParams.search}". Try different keywords.`
                    : 'No courses match your current filters.'}
                </p>
                <Link
                  href="/dashboard/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  <X size={18} />
                  Clear Filters
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Admin Footer */}
        {profile?.role === 'admin' && (
          <div className="mt-12 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
              <Link
                href="/admin/resources"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage Resources
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
