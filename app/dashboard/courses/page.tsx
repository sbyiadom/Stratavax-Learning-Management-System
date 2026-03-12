import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, Clock, Users, ArrowLeft, Filter, X } from 'lucide-react'

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

// Categories with proper mapping and beautiful logos
const categories = [
  { 
    id: 'all', 
    name: 'All Courses', 
    logo: '📚',
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  },
  { 
    id: 'Business & Entrepreneurship', 
    name: 'Business & Entrepreneurship', 
    displayName: '🚀 Entrepreneurship',
    logo: '🚀',
    color: 'from-emerald-600 to-teal-600',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: '💼'
  },
  { 
    id: 'Data Science & AI', 
    name: 'Data Science & AI', 
    displayName: '🤖 Data Science & AI',
    logo: '🤖',
    color: 'from-indigo-600 to-purple-600',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    icon: '📊'
  },
  { 
    id: 'Digital & Technology Skills', 
    name: 'Digital & Technology Skills', 
    displayName: '💻 Digital & Tech',
    logo: '💻',
    color: 'from-blue-600 to-cyan-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: '🖥️'
  },
  { 
    id: 'Engineering & Technical Skills', 
    name: 'Engineering & Technical Skills', 
    displayName: '⚙️ Engineering',
    logo: '⚙️',
    color: 'from-orange-600 to-amber-600',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    icon: '🔧'
  },
  { 
    id: 'Financial Literacy', 
    name: 'Financial Literacy', 
    displayName: '💰 Finance',
    logo: '💰',
    color: 'from-emerald-600 to-green-600',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: '📈'
  },
  { 
    id: 'Leadership & Personal Development', 
    name: 'Leadership & Personal Development', 
    displayName: '🌟 Leadership',
    logo: '🌟',
    color: 'from-purple-600 to-pink-600',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: '👥'
  },
  { 
    id: 'Programming & Development', 
    name: 'Programming & Development', 
    displayName: '👨‍💻 Programming',
    logo: '👨‍💻',
    color: 'from-pink-600 to-rose-600',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    icon: '💻'
  },
  { 
    id: 'Web Development', 
    name: 'Web Development', 
    displayName: '🌐 Web Development',
    logo: '🌐',
    color: 'from-cyan-600 to-blue-600',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    icon: '🕸️'
  },
]

// Difficulty level badges
const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
}

// Helper function to get category by ID
const getCategoryById = (id: string) => {
  return categories.find(c => c.id === id) || categories[0]
}

export default async function DashboardCoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; difficulty?: string; search?: string }
}) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }
    
    // First, let's fetch ALL published courses to see what categories exist
    const { data: allCourses, error: allCoursesError } = await supabase
      .from('courses')
      .select('category')
      .eq('is_published', true)
      .in('slug', APPROVED_COURSE_SLUGS)

    if (allCoursesError) {
      console.error('Error fetching categories:', allCoursesError)
    }

    // Fix: Use array reduce instead of Set spread to avoid TypeScript iteration issue
    const uniqueCategories = (allCourses || [])
      .map(c => c.category)
      .filter((category): category is string => Boolean(category))
      .reduce((acc: string[], category) => {
        if (!acc.includes(category)) {
          acc.push(category)
        }
        return acc
      }, [])
    
    console.log('Categories found in database:', uniqueCategories)

    // Build query with proper filters
    let query = supabase
      .from('courses')
      .select(`
        *,
        enrollments!left(count)
      `)
      .eq('is_published', true)
      .in('slug', APPROVED_COURSE_SLUGS)
    
    // Apply category filter - IMPORTANT: Use exact match with what's in database
    if (searchParams.category && searchParams.category !== 'all') {
      const decodedCategory = decodeURIComponent(searchParams.category)
      console.log('Filtering by category:', decodedCategory)
      
      // Try exact match first
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
    
    const currentCategoryData = getCategoryById(currentCategory)

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Catalog</h1>
                <p className="text-sm text-gray-600">
                  {currentCategory === 'all' 
                    ? `Browse all ${courses?.length || 0} courses` 
                    : `${currentCategoryData.displayName || currentCategoryData.name} • ${courses?.length || 0} courses`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Enhanced with beautiful category cards */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
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

                {/* Category Filter - Beautiful cards with logos */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const isActive = category.id === 'all' 
                        ? currentCategory === 'all'
                        : currentCategory === category.id
                      
                      // Count courses in this category from the fetched data
                      const categoryCount = category.id === 'all' 
                        ? courses?.length || 0
                        : courses?.filter(c => c.category === category.id).length || 0
                      
                      return (
                        <Link
                          key={category.id}
                          href={category.id === 'all' 
                            ? '/dashboard/courses' 
                            : `/dashboard/courses?category=${encodeURIComponent(category.id)}`}
                          className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                            isActive
                              ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                            isActive 
                              ? 'bg-white/20' 
                              : category.bgColor
                          }`}>
                            {category.logo}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {category.displayName || category.name}
                            </div>
                            {categoryCount > 0 && (
                              <div className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                                {categoryCount} {categoryCount === 1 ? 'course' : 'courses'}
                              </div>
                            )}
                          </div>
                          {isActive && (
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="mb-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Difficulty Level</h3>
                  <div className="space-y-2">
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
                      const href = params.toString() ? `/dashboard/courses?${params.toString()}` : '/dashboard/courses'
                      
                      const levelCount = courses?.filter(c => c.difficulty_level === level).length || 0
                      
                      return (
                        <Link
                          key={level}
                          href={href}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            searchParams.difficulty === level
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="capitalize text-sm font-medium">{level}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            searchParams.difficulty === level
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {levelCount}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(searchParams.difficulty || searchParams.search) && (
                  <div className="pt-6 border-t border-gray-200">
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

            {/* Course Grid */}
            <div className="flex-1">
              {/* Search Bar */}
              <div className="mb-6">
                <form action="/dashboard/courses" method="GET" className="relative">
                  {searchParams.category && searchParams.category !== 'all' && (
                    <input type="hidden" name="category" value={searchParams.category} />
                  )}
                  {searchParams.difficulty && (
                    <input type="hidden" name="difficulty" value={searchParams.difficulty} />
                  )}
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchParams.search}
                    placeholder="Search courses by title or description..."
                    className="w-full pl-4 pr-24 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* Results Count */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium text-gray-900">{courses?.length || 0}</span> courses
                </p>
                {currentCategory !== 'all' && (
                  <Link
                    href="/dashboard/courses"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear category
                  </Link>
                )}
              </div>

              {/* Course Cards - Enhanced with beautiful category logos */}
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const isEnrolled = enrolledCourseIds.has(course.id)
                    const category = getCategoryById(course.category || '')
                    
                    return (
                      <Link
                        key={course.id}
                        href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                      >
                        {/* Course Header with Category Logo */}
                        <div className={`relative h-32 bg-gradient-to-r ${category.color} p-4`}>
                          <div className="absolute top-3 right-3 flex gap-2">
                            {course.is_featured && (
                              <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                                Featured
                              </span>
                            )}
                            {isEnrolled && (
                              <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                                Enrolled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                              {category.logo}
                            </div>
                            <div>
                              <p className="text-white/80 text-xs">Course in</p>
                              <p className="text-white font-medium">{category.displayName || category.name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Course Content */}
                        <div className="p-5">
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                            {course.title}
                          </h3>

                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {course.short_description || course.description?.substring(0, 100) || 'No description available'}
                          </p>

                          {/* Course Stats */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {course.difficulty_level && (
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                  difficultyColors[course.difficulty_level as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800'
                                }`}>
                                  {course.difficulty_level}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={14} />
                                {course.duration_hours || '?'}h
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Users size={14} />
                              {course.enrollment_count || 0}
                            </span>
                          </div>

                          {/* Progress Bar for Enrolled Courses */}
                          {isEnrolled && (
                            <div className="mt-4">
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: '0%' }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchParams.category !== 'all' 
                      ? `No courses found in this category. Try browsing all courses.`
                      : searchParams.search
                      ? `No courses match your search "${searchParams.search}". Try different keywords.`
                      : `No courses available at the moment.`}
                  </p>
                  {(searchParams.category !== 'all' || searchParams.search) && (
                    <Link
                      href="/dashboard/courses"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      <X size={18} />
                      Clear Filters
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard courses error:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">Please try again later.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}
