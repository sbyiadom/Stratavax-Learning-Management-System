import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { 
  BookOpen, Clock, Users, Search, Filter, 
  Grid, List, SlidersHorizontal, ChevronRight,
  Star, TrendingUp, Award, GraduationCap,
  Sparkles, Target, CheckCircle, X
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

// Professional category colors
const categories = [
  { id: 'all', name: 'All Courses', icon: '📚', color: 'from-slate-600 to-slate-700', lightColor: 'bg-slate-100 text-slate-700' },
  { id: 'Business & Entrepreneurship', name: 'Business', icon: '🚀', color: 'from-emerald-600 to-teal-600', lightColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'Data Science & AI', name: 'Data Science', icon: '🤖', color: 'from-indigo-600 to-purple-600', lightColor: 'bg-indigo-100 text-indigo-700' },
  { id: 'Digital & Technology', name: 'Digital Tech', icon: '💻', color: 'from-blue-600 to-cyan-600', lightColor: 'bg-blue-100 text-blue-700' },
  { id: 'Engineering', name: 'Engineering', icon: '⚙️', color: 'from-orange-600 to-amber-600', lightColor: 'bg-orange-100 text-orange-700' },
  { id: 'Financial Literacy', name: 'Finance', icon: '💰', color: 'from-emerald-600 to-green-600', lightColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'Leadership', name: 'Leadership', icon: '🌟', color: 'from-purple-600 to-pink-600', lightColor: 'bg-purple-100 text-purple-700' },
  { id: 'Programming', name: 'Programming', icon: '👨‍💻', color: 'from-pink-600 to-rose-600', lightColor: 'bg-pink-100 text-pink-700' },
  { id: 'Web Development', name: 'Web Dev', icon: '🌐', color: 'from-cyan-600 to-blue-600', lightColor: 'bg-cyan-100 text-cyan-700' },
]

// Difficulty badges with professional colors
const difficultyConfig = {
  beginner: { label: 'Beginner', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '📈' },
  advanced: { label: 'Advanced', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: '🔥' },
}

interface PageProps {
  searchParams: {
    category?: string
    difficulty?: string
    search?: string
    sort?: string
    view?: 'grid' | 'list'
  }
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Build query
  let query = supabase
    .from('courses')
    .select(`
      *,
      enrollments!left(count)
    `)
    .eq('is_published', true)
    .in('slug', APPROVED_COURSE_SLUGS)
  
  // Apply filters
  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category', searchParams.category)
  }
  
  if (searchParams.difficulty) {
    query = query.eq('difficulty_level', searchParams.difficulty)
  }
  
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }
  
  // Apply sorting
  switch (searchParams.sort) {
    case 'title-asc':
      query = query.order('title', { ascending: true })
      break
    case 'title-desc':
      query = query.order('title', { ascending: false })
      break
    case 'popular':
      query = query.order('enrollment_count', { ascending: false, nullsFirst: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('title')
  }
  
  const { data: courses } = await query

  // Get user's enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', user.id)

  const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])

  const currentCategory = searchParams.category && searchParams.category !== 'all'
    ? decodeURIComponent(searchParams.category)
    : 'all'

  const viewMode = searchParams.view || 'grid'
  const totalCourses = courses?.length || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Stratavax Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Stratavax</h1>
                <p className="text-xs text-slate-500">Learning Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden md:block">Welcome,</span>
              <span className="text-sm font-semibold text-blue-600 hidden md:block">
                {profile?.first_name || profile?.last_name || user.email?.split('@')[0]}
              </span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Course Catalog</h1>
          <p className="text-slate-600 mt-1">
            Browse and enroll in <span className="font-semibold text-blue-600">{totalCourses} free courses</span>
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Professional Cards */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
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

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Category</h3>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const isActive = category.id === 'all' 
                      ? currentCategory === 'all'
                      : currentCategory === category.id
                    
                    return (
                      <Link
                        key={category.id}
                        href={category.id === 'all' 
                          ? '/dashboard/courses' 
                          : `/dashboard/courses?category=${encodeURIComponent(category.id)}`}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm ${
                          isActive ? 'bg-white/20' : category.lightColor
                        }`}>
                          {category.icon}
                        </div>
                        <span className="flex-1 font-medium">{category.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Difficulty</h3>
                <div className="space-y-2">
                  {Object.entries(difficultyConfig).map(([key, config]) => {
                    const params = new URLSearchParams(searchParams as any)
                    if (searchParams.difficulty === key) {
                      params.delete('difficulty')
                    } else {
                      params.set('difficulty', key)
                    }
                    if (searchParams.category && searchParams.category !== 'all') {
                      params.set('category', searchParams.category)
                    }
                    
                    return (
                      <Link
                        key={key}
                        href={`/dashboard/courses?${params.toString()}`}
                        className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                          searchParams.difficulty === key
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        {searchParams.difficulty === key && (
                          <CheckCircle size={16} className="text-white/80" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Active Filters */}
              {(searchParams.difficulty || searchParams.search) && (
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Active Filters</h3>
                  <div className="flex flex-wrap gap-2">
                    {searchParams.difficulty && (
                      <Link
                        href={`/dashboard/courses?${new URLSearchParams({
                          ...searchParams,
                          difficulty: '',
                        } as any)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100"
                      >
                        {searchParams.difficulty}
                        <X size={12} />
                      </Link>
                    )}
                    {searchParams.search && (
                      <Link
                        href={`/dashboard/courses?${new URLSearchParams({
                          ...searchParams,
                          search: '',
                        } as any)}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100"
                      >
                        "{searchParams.search}"
                        <X size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search and Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
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
                      placeholder="Search courses..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </form>
                </div>

                {/* Sort and View Controls */}
                <div className="flex gap-2">
                  <select
                    name="sort"
                    defaultValue={searchParams.sort || 'featured'}
                    onChange={(e) => {
                      const params = new URLSearchParams(searchParams as any)
                      params.set('sort', e.target.value)
                      window.location.href = `/dashboard/courses?${params.toString()}`
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="featured">Featured</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="popular">Most Popular</option>
                  </select>

                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <Link
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, view: 'grid' } as any)}`}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600'
                      }`}
                    >
                      <Grid size={18} />
                    </Link>
                    <Link
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, view: 'list' } as any)}`}
                      className={`p-2 transition-colors ${
                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600'
                      }`}
                    >
                      <List size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{totalCourses}</span> courses
            </div>

            {/* Course Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses?.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id)
                  const category = categories.find(c => c.id === course.category) || categories[0]
                  
                  return (
                    <Link
                      key={course.id}
                      href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                      className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* Course Header with Category Color */}
                      <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                      
                      <div className="p-5">
                        {/* Badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${category.lightColor}`}>
                              {category.icon}
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-500">{category.name}</span>
                              {course.difficulty_level && (
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                  difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.color
                                }`}>
                                  {difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.icon}
                                  {' '}{course.difficulty_level}
                                </span>
                              )}
                            </div>
                          </div>
                          {course.is_featured && (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                              <Star size={12} />
                              Featured
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                          {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {course.short_description || course.description?.substring(0, 100) || 'No description available'}
                        </p>

                        {/* Stats */}
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
                          {isEnrolled ? (
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                              <CheckCircle size={12} />
                              Enrolled
                            </span>
                          ) : (
                            <span className="text-blue-600 text-xs font-medium group-hover:translate-x-1 transition-transform">
                              View Course →
                            </span>
                          )}
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
                  const category = categories.find(c => c.id === course.category) || categories[0]
                  
                  return (
                    <Link
                      key={course.id}
                      href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                      className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden flex"
                    >
                      <div className={`w-1 bg-gradient-to-b ${category.color}`} />
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.color
                              }`}>
                                {difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.icon}
                                {' '}{course.difficulty_level || 'All levels'}
                              </span>
                              <span className="text-xs text-slate-500">{category.name}</span>
                              {course.is_featured && (
                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                  <Star size={12} />
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
                              <p className="text-sm font-medium text-slate-900">{course.duration_hours || '?'} hours</p>
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
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  {searchParams.search 
                    ? `No results match "${searchParams.search}". Try different keywords.`
                    : 'No courses match your current filters.'}
                </p>
                <Link
                  href="/dashboard/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Admin Footer - Only visible to admins */}
        {profile?.role === 'admin' && (
          <div className="mt-12 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Admin</span>
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
