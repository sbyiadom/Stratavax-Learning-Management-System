import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'
import { 
  BookOpen, Clock, Users, Search, 
  SlidersHorizontal, ChevronRight,
  Star, Award, GraduationCap,
  CheckCircle, X,
  ArrowLeft, TrendingUp, BarChart,
  Briefcase, Code, Database, Globe,
  Lightbulb, LineChart, Target, Zap
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
  'business-growth-strategy',
  'marketing-sales',
  'digital-marketing',
  'leadership',
  'basic-mechanical-engineering'
]

// Professional categories without emojis
const categories = [
  { id: 'all', name: 'All Courses', icon: BookOpen, color: 'bg-gray-600' },
  { id: 'Business & Entrepreneurship', name: 'Business & Entrepreneurship', icon: Briefcase, color: 'bg-green-600' },
  { id: 'Data Science & AI', name: 'Data Science & AI', icon: Database, color: 'bg-indigo-600' },
  { id: 'Digital & Technology Skills', name: 'Digital & Technology', icon: Code, color: 'bg-blue-600' },
  { id: 'Engineering & Technical Skills', name: 'Engineering', icon: BarChart, color: 'bg-orange-600' },
  { id: 'Financial Literacy', name: 'Financial Literacy', icon: TrendingUp, color: 'bg-emerald-600' },
  { id: 'Leadership & Personal Development', name: 'Leadership', icon: Target, color: 'bg-purple-600' },
  { id: 'Programming & Development', name: 'Programming', icon: Code, color: 'bg-pink-600' },
  { id: 'Web Development', name: 'Web Development', icon: Globe, color: 'bg-cyan-600' },
]

// Difficulty level badges
const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

export default async function DashboardCoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; difficulty?: string; search?: string; view?: 'all' | 'my' }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single()
  
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', user.id)

  const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || [])
  
  const categoryCounts = {
    'Business & Entrepreneurship': 7,
    'Data Science & AI': 2,
    'Digital & Technology Skills': 1,
    'Engineering & Technical Skills': 2,
    'Financial Literacy': 1,
    'Leadership & Personal Development': 1,
    'Programming & Development': 2,
    'Web Development': 1,
  }
  
  const totalCourses = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const enrolledCount = enrolledCourseIds.size
  const viewMode = searchParams.view || 'all'
  
  let query = supabase
    .from('courses')
    .select(`
      *,
      enrollments!left(user_id, course_id)
    `)
    .eq('is_published', true)
    .in('slug', APPROVED_COURSE_SLUGS)
  
  if (viewMode === 'my') {
    if (enrolledCourseIds.size === 0) {
      return (
        <CoursesPageContent 
          courses={[]}
          enrolledCourseIds={enrolledCourseIds}
          searchParams={searchParams}
          profile={profile}
          user={user}
          viewMode={viewMode}
          totalCourses={totalCourses}
          enrolledCount={enrolledCount}
          categoryCounts={categoryCounts}
        />
      )
    }
    query = query.in('id', Array.from(enrolledCourseIds))
  }
  
  if (searchParams.category && searchParams.category !== 'all') {
    const decodedCategory = decodeURIComponent(searchParams.category)
    query = query.eq('category', decodedCategory)
  }
  
  if (searchParams.difficulty) {
    query = query.eq('difficulty_level', searchParams.difficulty)
  }
  
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }
  
  query = query.order('is_featured', { ascending: false }).order('title')
  
  const { data: courses, error } = await query

  if (error) {
    console.error('Error fetching courses:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Courses</h2>
          <p className="text-gray-600 mb-6">There was an error loading the course catalog.</p>
          <Link href="/dashboard" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CoursesPageContent 
      courses={courses || []}
      enrolledCourseIds={enrolledCourseIds}
      searchParams={searchParams}
      profile={profile}
      user={user}
      viewMode={viewMode}
      totalCourses={totalCourses}
      enrolledCount={enrolledCount}
      categoryCounts={categoryCounts}
    />
  )
}

function CoursesPageContent({ 
  courses, 
  enrolledCourseIds,
  searchParams,
  profile,
  user,
  viewMode,
  totalCourses,
  enrolledCount,
  categoryCounts
}: { 
  courses: any[]
  enrolledCourseIds: Set<string>
  searchParams: any
  profile: any
  user: any
  viewMode: string
  totalCourses: number
  enrolledCount: number
  categoryCounts: any
}) {
  
  const currentCategory = searchParams.category && searchParams.category !== 'all'
    ? decodeURIComponent(searchParams.category)
    : 'all'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                  <GraduationCap className="text-white" size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Stratavax</h1>
                  <p className="text-xs text-gray-500">Learning Management System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.first_name || profile?.last_name || user.email?.split('@')[0]}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                {(profile?.first_name?.[0] || user.email?.charAt(0) || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Pills */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/courses?view=all"
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Courses ({totalCourses})
          </Link>
          <Link
            href="/dashboard/courses?view=my"
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'my'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            My Courses ({enrolledCount})
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {viewMode === 'all' ? 'Course Catalog' : 'My Learning'}
          </h1>
          <p className="text-gray-500 mt-1">
            {viewMode === 'all' 
              ? `Explore ${totalCourses} professional development courses`
              : `Continue your learning journey`}
          </p>
        </div>

        {/* Search Bar */}
        {viewMode === 'all' && (
          <div className="mb-8">
            <form className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search courses by title, topic, or skill..."
                className="w-full pl-11 pr-32 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Empty State */}
        {viewMode === 'my' && courses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-gray-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No enrolled courses</h3>
            <p className="text-gray-500 mb-6">Browse our catalog to find courses that interest you.</p>
            <Link
              href="/dashboard/courses?view=all"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Courses
            </Link>
          </div>
        )}

        {(viewMode === 'all' || courses.length > 0) && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            {viewMode === 'all' && (
              <div className="lg:w-72 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-gray-500" />
                      Filters
                    </h2>
                    {(searchParams.category || searchParams.difficulty || searchParams.search) && (
                      <Link
                        href="/dashboard/courses?view=all"
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <X size={12} />
                        Clear
                      </Link>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</h3>
                    <div className="space-y-1">
                      <Link
                        href="/dashboard/courses?view=all"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          currentCategory === 'all' && viewMode === 'all'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <BookOpen size={16} className={currentCategory === 'all' ? 'text-blue-600' : 'text-gray-400'} />
                        <span className="flex-1">All Courses</span>
                        <span className="text-xs text-gray-400">{totalCourses}</span>
                      </Link>

                      {categories.filter(c => c.id !== 'all').map((category) => {
                        const count = categoryCounts[category.id as keyof typeof categoryCounts] || 0
                        const isActive = currentCategory === category.id
                        const Icon = category.icon
                        
                        return (
                          <Link
                            key={category.id}
                            href={`/dashboard/courses?view=all&category=${encodeURIComponent(category.id)}`}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                            <span className="flex-1">{category.name}</span>
                            <span className="text-xs text-gray-400">{count}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Difficulty</h3>
                    <div className="flex flex-wrap gap-2">
                      {['beginner', 'intermediate', 'advanced'].map((level) => {
                        const params = new URLSearchParams({ view: 'all', ...searchParams })
                        if (params.get('difficulty') === level) {
                          params.delete('difficulty')
                        } else {
                          params.set('difficulty', level)
                        }
                        
                        return (
                          <Link
                            key={level}
                            href={`/dashboard/courses?${params.toString()}`}
                            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                              searchParams.difficulty === level
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {level}
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(searchParams.difficulty || searchParams.search) && (
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active</h3>
                      <div className="flex flex-wrap gap-2">
                        {searchParams.difficulty && (
                          <Link
                            href={`/dashboard/courses?${new URLSearchParams({
                              view: 'all',
                              ...searchParams,
                              difficulty: '',
                            })}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
                          >
                            {searchParams.difficulty}
                            <X size={10} />
                          </Link>
                        )}
                        {searchParams.search && (
                          <Link
                            href={`/dashboard/courses?${new URLSearchParams({
                              view: 'all',
                              ...searchParams,
                              search: '',
                            })}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
                          >
                            {searchParams.search}
                            <X size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Course Grid */}
            <div className={viewMode === 'all' ? 'flex-1' : 'w-full'}>
              {courses.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {courses.length} course{courses.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const isEnrolled = enrolledCourseIds.has(course.id)
                    const courseImage = getCourseImage(course.slug, course.title)
                    
                    return (
                      <Link
                        key={course.id}
                        href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200"
                      >
                        {/* Course Image */}
                        <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                          <CourseImage
                            src={courseImage}
                            alt={course.title}
                            title={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {course.is_featured && (
                              <span className="bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                <Star size={12} />
                                Featured
                              </span>
                            )}
                            {isEnrolled && (
                              <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                <CheckCircle size={12} />
                                Enrolled
                              </span>
                            )}
                          </div>

                          {/* Difficulty Badge */}
                          {course.difficulty_level && (
                            <div className="absolute bottom-3 left-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium shadow-sm ${
                                difficultyColors[course.difficulty_level as keyof typeof difficultyColors]
                              }`}>
                                {course.difficulty_level}
                              </span>
                            </div>
                          )}
                          
                          {/* Duration Badge */}
                          {course.duration_hours && (
                            <div className="absolute bottom-3 right-3">
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                                <Clock size={12} />
                                {course.duration_hours}h
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="p-4">
                          <div className="mb-2">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {course.category?.split(' ')[0] || 'Course'}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition line-clamp-2">
                            {course.title}
                          </h3>

                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {course.short_description || course.description?.substring(0, 80) || 'Start learning today'}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {course.enrollment_count || 0}
                              </span>
                            </div>
                            <span className="text-blue-600 text-sm font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                              {isEnrolled ? 'Continue' : 'Explore'}
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : viewMode === 'all' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-400" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchParams.search 
                      ? `No results for "${searchParams.search}"`
                      : 'Try adjusting your filters'}
                  </p>
                  <Link
                    href="/dashboard/courses?view=all"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Clear filters
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Admin Footer */}
        {profile?.role === 'admin' && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">Admin Access</span>
              </div>
              <Link href="/admin/resources" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
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
