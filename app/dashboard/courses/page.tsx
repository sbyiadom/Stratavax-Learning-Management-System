import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { 
  BookOpen, Clock, Users, ArrowLeft, ChevronRight, 
  Search, Star, Grid, List, SlidersHorizontal,
  GraduationCap, Sparkles, Target, Globe, Code, Database,
  CheckCircle, X, Bookmark, Award
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

// Categories with metadata
const categories = [
  { id: 'all', name: 'All Courses', icon: '📚', color: 'from-slate-600 to-slate-700', lightColor: 'bg-slate-100 text-slate-700' },
  { id: 'Business & Entrepreneurship', name: 'Entrepreneurship', icon: '🚀', color: 'from-emerald-600 to-teal-600', lightColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'Data Science & AI', name: 'Data Science & AI', icon: '🤖', color: 'from-indigo-600 to-purple-600', lightColor: 'bg-indigo-100 text-indigo-700' },
  { id: 'Digital & Technology Skills', name: 'Digital & Technology', icon: '💻', color: 'from-blue-600 to-cyan-600', lightColor: 'bg-blue-100 text-blue-700' },
  { id: 'Engineering & Technical Skills', name: 'Engineering', icon: '⚙️', color: 'from-orange-600 to-amber-600', lightColor: 'bg-orange-100 text-orange-700' },
  { id: 'Financial Literacy', name: 'Finance', icon: '💰', color: 'from-emerald-600 to-green-600', lightColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'Leadership & Personal Development', name: 'Leadership', icon: '🌟', color: 'from-purple-600 to-pink-600', lightColor: 'bg-purple-100 text-purple-700' },
  { id: 'Programming & Development', name: 'Programming', icon: '👨‍💻', color: 'from-pink-600 to-rose-600', lightColor: 'bg-pink-100 text-pink-700' },
  { id: 'Web Development', name: 'Web Development', icon: '🌐', color: 'from-cyan-600 to-blue-600', lightColor: 'bg-cyan-100 text-cyan-700' },
]

// Difficulty level badges
const difficultyConfig = {
  beginner: { label: 'Beginner', color: 'bg-emerald-100 text-emerald-700', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700', icon: '📈' },
  advanced: { label: 'Advanced', color: 'bg-rose-100 text-rose-700', icon: '🔥' },
}

// Sort options
const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
]

interface PageProps {
  searchParams: {
    category?: string
    difficulty?: string
    search?: string
    sort?: string
    view?: 'grid' | 'list'
    page?: string
  }
}

export default async function DashboardCoursesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  
  // Check if user is authenticated
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

  // Build category counts from actual data
  const { data: categoryData } = await supabase
    .from('courses')
    .select('category')
    .in('slug', APPROVED_COURSE_SLUGS)
    .eq('is_published', true)

  const categoryCounts: Record<string, number> = {}
  categoryData?.forEach(course => {
    if (course.category) {
      categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1
    }
  })
  
  const totalCourses = categoryData?.length || 0

  // Get total count for pagination
  let countQuery = supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .in('slug', APPROVED_COURSE_SLUGS)
  
  // Apply filters to count query
  if (searchParams.category && searchParams.category !== 'all') {
    countQuery = countQuery.eq('category', searchParams.category)
  }
  
  if (searchParams.difficulty) {
    countQuery = countQuery.eq('difficulty_level', searchParams.difficulty)
  }
  
  if (searchParams.search) {
    countQuery = countQuery.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }
  
  const { count: totalCount } = await countQuery

  // Build main query
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
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'popular':
      query = query.order('enrollment_count', { ascending: false, nullsFirst: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('title')
  }
  
  // Pagination
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data: courses, error } = await query

  if (error) {
    console.error('Error fetching courses:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Courses</h2>
          <p className="text-slate-600 mb-6">There was an error loading the course catalog. Please try again.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
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

  // Get user's saved courses
  const { data: savedCourses } = await supabase
    .from('user_favorites')
    .select('item_id')
    .eq('user_id', user.id)
    .eq('item_type', 'course')

  const savedCourseIds = new Set(savedCourses?.map(s => s.item_id) || [])

  const currentCategory = searchParams.category && searchParams.category !== 'all'
    ? decodeURIComponent(searchParams.category)
    : 'all'

  const viewMode = searchParams.view || 'grid'

  const totalPages = Math.ceil((totalCount || 0) / pageSize)
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Stratavax
                  </h1>
                  <p className="text-xs text-slate-500">Learning Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-900">Welcome back,</p>
                <p className="text-sm text-blue-600 font-semibold">{profile?.name || user.email?.split('@')[0]}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {(profile?.name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">Course Catalog</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
          <div className="relative">
            <h1 className="text-3xl font-bold mb-2">Explore Your Learning Journey</h1>
            <p className="text-white/90 mb-6 max-w-2xl">
              Discover courses tailored to your goals. From beginner to advanced, 
              find the perfect path to advance your career.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <BookOpen size={18} />
                <span className="text-sm font-medium">{totalCourses} Total Courses</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <Users size={18} />
                <span className="text-sm font-medium">Active Learners</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <Award size={18} />
                <span className="text-sm font-medium">Expert Instructors</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-blue-600" />
                  Filters
                </h2>
                {(searchParams.category || searchParams.difficulty || searchParams.search) && (
                  <Link href="/dashboard/courses" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <X size={14} />
                    Clear all
                  </Link>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Categories</h3>
                <div className="space-y-1">
                  <Link
                    href="/dashboard/courses"
                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                      currentCategory === 'all'
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentCategory === 'all' ? 'bg-white/20' : 'bg-slate-100'
                    }`}>
                      <span className="text-lg">📚</span>
                    </div>
                    <span className="flex-1 font-medium">All Courses</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {totalCourses}
                    </span>
                  </Link>

                  {categories.filter(c => c.id !== 'all').map((category) => {
                    const count = categoryCounts[category.id] || 0
                    const isActive = currentCategory === category.id

                    return (
                      <Link
                        key={category.id}
                        href={`/dashboard/courses?category=${encodeURIComponent(category.id)}`}
                        className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                          isActive ? `bg-gradient-to-r ${category.color} text-white shadow-md` : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-white/20' : category.lightColor
                        }`}>
                          <span className="text-lg">{category.icon}</span>
                        </div>
                        <span className="flex-1 font-medium">{category.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Difficulty Level</h3>
                <div className="space-y-2">
                  {Object.entries(difficultyConfig).map(([key, config]) => {
                    const params = new URLSearchParams(searchParams as any)
                    params.set('difficulty', key)
                    
                    return (
                      <Link
                        key={key}
                        href={`/dashboard/courses?${params.toString()}`}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          searchParams.difficulty === key ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{config.icon}</span>
                          <span className={`text-sm font-medium ${
                            searchParams.difficulty === key ? 'text-white' : 'text-slate-700'
                          }`}>
                            {config.label}
                          </span>
                        </div>
                        {searchParams.difficulty === key && <CheckCircle size={16} className="text-white/70" />}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Learning Paths */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Target size={16} className="text-blue-600" />
                  Learning Paths
                </h3>
                <div className="space-y-3">
                  <Link href="/dashboard/learning-paths/web-development" className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Globe className="text-white" size={16} />
                      </div>
                      <span className="font-medium text-slate-900">Web Development</span>
                    </div>
                    <p className="text-xs text-slate-600">5 courses • 42 hours</p>
                  </Link>
                  <Link href="/dashboard/learning-paths/data-science" className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Database className="text-white" size={16} />
                      </div>
                      <span className="font-medium text-slate-900">Data Science</span>
                    </div>
                    <p className="text-xs text-slate-600">4 courses • 36 hours</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <form action="/dashboard/courses" method="GET" className="relative">
                    {Object.entries(searchParams).map(([key, value]) => {
                      if (key !== 'search' && value) {
                        return <input key={key} type="hidden" name={key} value={value} />
                      }
                      return null
                    })}
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      name="search"
                      defaultValue={searchParams.search}
                      placeholder="Search courses..."
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </form>
                </div>

                <div className="flex gap-2">
                  <form action="/dashboard/courses" method="GET">
                    {Object.entries(searchParams).map(([key, value]) => {
                      if (key !== 'sort' && value) {
                        return <input key={key} type="hidden" name={key} value={value} />
                      }
                      return null
                    })}
                    <select
                      name="sort"
                      defaultValue={searchParams.sort || 'featured'}
                      onChange={(e) => e.target.form?.submit()}
                      className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-white text-sm"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          Sort by: {option.label}
                        </option>
                      ))}
                    </select>
                  </form>

                  <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <Link
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, view: 'grid' } as any)}`}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <Grid size={20} />
                    </Link>
                    <Link
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, view: 'list' } as any)}`}
                      className={`p-2 transition-colors ${
                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <List size={20} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(searchParams.difficulty || searchParams.search) && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  {searchParams.difficulty && (
                    <Link
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, difficulty: '' } as any)}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                    >
                      <span>Difficulty: {searchParams.difficulty}</span>
                      <X size={14} />
                    </Link>
                  )}
                  {searchParams.search && (
                    <Link
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, search: '' } as any)}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                    >
                      <span>Search: "{searchParams.search}"</span>
                      <X size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Results Stats */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-medium text-slate-900">{courses?.length || 0}</span> of{' '}
                <span className="font-medium text-slate-900">{totalCount || 0}</span> courses
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-slate-600">
                  Page <span className="font-medium text-slate-900">{page}</span> of {totalPages}
                </p>
              )}
            </div>

            {/* Course Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses?.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id)
                  const isSaved = savedCourseIds.has(course.id)
                  
                  return (
                    <Link
                      key={course.id}
                      href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                      className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all overflow-hidden"
                    >
                      <div className={`relative h-40 bg-gradient-to-br ${
                        categories.find(c => c.id === course.category)?.color || 'from-slate-500 to-slate-600'
                      }`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl opacity-20 group-hover:scale-110 transition-transform">
                            {categories.find(c => c.id === course.category)?.icon || '📚'}
                          </span>
                        </div>
                        <div className="absolute top-3 left-3 flex gap-2">
                          {course.is_featured && (
                            <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                              <Star size={12} />
                              Featured
                            </span>
                          )}
                          {isEnrolled && (
                            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                              <CheckCircle size={12} />
                              Enrolled
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => e.preventDefault()}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/40"
                        >
                          <Bookmark size={16} className="text-white" fill={isSaved ? 'white' : 'none'} />
                        </button>
                        <div className="absolute bottom-3 left-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm ${
                            difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.color
                          }`}>
                            {difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.icon} {''}
                            {difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.label}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {course.category?.split(' ')[0] || 'Course'}
                          </span>
                        </div>

                        <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {course.short_description || course.description?.substring(0, 100)}...
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {course.duration_hours || '?'}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {course.enrollment_count || 0}
                            </span>
                          </div>
                          <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                            {isEnrolled ? 'Continue →' : 'Start →'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {courses?.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id)
                  const isSaved = savedCourseIds.has(course.id)
                  
                  return (
                    <Link
                      key={course.id}
                      href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                      className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden flex"
                    >
                      <div className={`w-48 bg-gradient-to-br ${
                        categories.find(c => c.id === course.category)?.color || 'from-slate-500 to-slate-600'
                      } relative`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl opacity-20">
                            {categories.find(c => c.id === course.category)?.icon || '📚'}
                          </span>
                        </div>
                        {course.is_featured && (
                          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-lg">
                            <Star size={12} className="inline mr-1" />
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {course.category?.split(' ')[0] || 'Course'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.color
                              }`}>
                                {difficultyConfig[course.difficulty_level as keyof typeof difficultyConfig]?.label}
                              </span>
                              {isEnrolled && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  Enrolled
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                              {course.title}
                            </h3>
                          </div>
                          <button onClick={(e) => e.preventDefault()} className="p-2 text-slate-400 hover:text-yellow-500">
                            <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {course.description || course.short_description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {course.duration_hours || '?'} hours
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={16} />
                            {course.enrollment_count || 0} enrolled
                          </span>
                          <span className="text-blue-600 font-medium ml-auto group-hover:translate-x-1 transition-transform">
                            {isEnrolled ? 'Continue Learning →' : 'View Course →'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* No Results */}
            {(!courses || courses.length === 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Courses Found</h3>
                <p className="text-slate-600 mb-6">
                  Try adjusting your filters or search term.
                </p>
                <Link
                  href="/dashboard/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  <X size={18} />
                  Clear All Filters
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
                  <Link
                    href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, page: Math.max(1, page - 1).toString() } as any)}`}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      page === 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ←
                  </Link>
                  
                  {pages.map(p => (
                    <Link
                      key={p}
                      href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, page: p.toString() } as any)}`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium ${
                        page === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}

                  <Link
                    href={`/dashboard/courses?${new URLSearchParams({ ...searchParams, page: Math.min(totalPages, page + 1).toString() } as any)}`}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      page === totalPages ? 'text-slate-300 pointer-events-none' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
