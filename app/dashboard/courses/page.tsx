import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, Clock, BarChart, Users, Filter, ArrowLeft, ChevronRight } from 'lucide-react'

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

// Categories with their display names and icons
const categories = [
  { id: 'all', name: 'All Courses', icon: '📚', color: 'bg-gray-600' },
  { id: 'Business & Entrepreneurship', name: '🚀 Entrepreneurship', icon: '🚀', color: 'bg-green-600' },
  { id: 'Data Science & AI', name: '🤖 Data Science & AI', icon: '🤖', color: 'bg-indigo-600' },
  { id: 'Digital & Technology Skills', name: '💻 Digital & Technology', icon: '💻', color: 'bg-blue-600' },
  { id: 'Engineering & Technical Skills', name: '⚙️ Engineering', icon: '⚙️', color: 'bg-orange-600' },
  { id: 'Financial Literacy', name: '💰 Finance', icon: '💰', color: 'bg-emerald-600' },
  { id: 'Leadership & Personal Development', name: '🌟 Leadership', icon: '🌟', color: 'bg-purple-600' },
  { id: 'Programming & Development', name: '👨‍💻 Programming', icon: '👨‍💻', color: 'bg-pink-600' },
  { id: 'Web Development', name: '🌐 Web Development', icon: '🌐', color: 'bg-cyan-600' },
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
      modules(count),
      enrollments!left(user_id, course_id)
    `)
    .eq('is_published', true)
    .in('slug', APPROVED_COURSE_SLUGS)
  
  // Apply category filter - with proper decoding
  if (searchParams.category && searchParams.category !== 'all') {
    const decodedCategory = decodeURIComponent(searchParams.category)
    console.log('Filtering by category:', decodedCategory)
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
    return <div className="p-8 text-center text-red-600">Failed to load courses</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Catalog</h1>
              <p className="text-sm text-gray-600">
                {currentCategory === 'all' 
                  ? `Browse all ${totalCourses} courses` 
                  : `${categories.find(c => c.id === currentCategory)?.name || currentCategory} • ${courses?.length || 0} courses`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Categories</h2>
                <Filter size={18} className="text-gray-400" />
              </div>

              {/* Category Filter with Counts */}
              <div className="mb-6">
                <div className="space-y-1">
                  {/* All Courses - with total count */}
                  <Link
                    href="/dashboard/courses"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                      currentCategory === 'all'
                        ? 'bg-gray-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">📚</span>
                    <span className="flex-1">All Courses</span>
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                          isActive
                            ? `${category.color} text-white`
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="flex-1">{category.name}</span>
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
              <div className="mb-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Difficulty</h3>
                <div className="flex flex-wrap gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <Link
                      key={level}
                      href={`/dashboard/courses?${currentCategory !== 'all' ? `category=${encodeURIComponent(currentCategory)}&` : ''}difficulty=${level}`}
                      className={`px-3 py-1.5 text-xs rounded-full capitalize transition ${
                        searchParams.difficulty === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(searchParams.category && searchParams.category !== 'all') || searchParams.difficulty || searchParams.search ? (
                <Link
                  href="/dashboard/courses"
                  className="block w-full text-center px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition"
                >
                  Clear All Filters
                </Link>
              ) : null}
            </div>
          </div>

          {/* Course Grid */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <form className="flex gap-2">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchParams.search}
                  placeholder="Search courses..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {courses?.length || 0} courses
              </p>
              <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>Sort by: Featured</option>
                <option>Sort by: Title A-Z</option>
                <option>Sort by: Most Popular</option>
                <option>Sort by: Newest</option>
              </select>
            </div>

            {/* Course Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)
                
                return (
                  <Link
                    key={course.id}
                    href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group"
                  >
                    {/* Course Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                      {course.is_featured && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                      {isEnrolled && (
                        <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Enrolled
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center text-white text-4xl opacity-20">
                        {course.category === 'Business & Entrepreneurship' && '🚀'}
                        {course.category === 'Data Science & AI' && '🤖'}
                        {course.category === 'Digital & Technology Skills' && '💻'}
                        {course.category === 'Engineering & Technical Skills' && '⚙️'}
                        {course.category === 'Financial Literacy' && '💰'}
                        {course.category === 'Leadership & Personal Development' && '🌟'}
                        {course.category === 'Programming & Development' && '👨‍💻'}
                        {course.category === 'Web Development' && '🌐'}
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          difficultyColors[course.difficulty_level as keyof typeof difficultyColors]
                        }`}>
                          {course.difficulty_level}
                        </span>
                        <span className="text-xs text-gray-500">
                          {course.category?.split(' ')[0] || ''}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.short_description}
                      </p>

                      {/* Course Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {course.modules?.[0]?.count || 0} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {course.duration_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {course.enrollments?.length || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* No Results */}
            {(!courses || courses.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">
                  {currentCategory !== 'all' 
                    ? categories.find(c => c.id === currentCategory)?.icon || '📚'
                    : '📚'}
                </div>
                <p className="text-gray-500">No courses found matching your criteria.</p>
                <Link href="/dashboard/courses" className="text-blue-600 hover:underline mt-2 inline-block">
                  View all courses
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
