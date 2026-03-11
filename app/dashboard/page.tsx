import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, Clock, BarChart, Users, Filter, ArrowLeft } from 'lucide-react'

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
  
  // Apply filters - Using exact category names from your database
  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category', searchParams.category)
  }
  
  if (searchParams.difficulty) {
    query = query.eq('difficulty_level', searchParams.difficulty)
  }
  
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
                Browse and enroll in {courses?.length || 0} free courses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <Filter size={18} className="text-gray-400" />
              </div>

              {/* Category Filter - Updated with your exact categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/dashboard/courses?category=${category.id}`}
                      className={`block px-3 py-2 rounded-md text-sm transition ${
                        (searchParams.category || 'all') === category.id
                          ? `${category.color} text-white`
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Difficulty</h3>
                <div className="space-y-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <Link
                      key={level}
                      href={`/dashboard/courses?difficulty=${level}`}
                      className={`block px-3 py-2 rounded-md text-sm capitalize ${
                        searchParams.difficulty === level
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {level}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <Link
                href="/dashboard/courses"
                className="block w-full text-center px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition"
              >
                Clear All Filters
              </Link>
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
            <div className="mb-4 text-sm text-gray-600">
              Showing {courses?.length || 0} courses
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
