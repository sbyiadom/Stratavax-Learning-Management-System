import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'
import { 
  BookOpen, Clock, Users, Search, 
  SlidersHorizontal, ChevronRight,
  Star, Award, GraduationCap,
  CheckCircle, X,
  ArrowLeft, Briefcase, Code, Database, Globe,
  TrendingUp, Target, BarChart, Filter
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

// Professional categories
const categories = [
  { id: 'all', name: 'All Courses', icon: BookOpen },
  { id: 'Business & Entrepreneurship', name: 'Business & Entrepreneurship', icon: Briefcase },
  { id: 'Data Science & AI', name: 'Data Science & AI', icon: Database },
  { id: 'Digital & Technology Skills', name: 'Digital & Technology', icon: Code },
  { id: 'Engineering & Technical Skills', name: 'Engineering', icon: BarChart },
  { id: 'Financial Literacy', name: 'Financial Literacy', icon: TrendingUp },
  { id: 'Leadership & Personal Development', name: 'Leadership', icon: Target },
  { id: 'Programming & Development', name: 'Programming', icon: Code },
  { id: 'Web Development', name: 'Web Development', icon: Globe },
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
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={18} className="text-gray-500" />
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white" size={16} />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">Stratavax</h1>
                  <p className="text-xs text-gray-500">LMS</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-500">Welcome,</p>
                <p className="text-xs font-medium text-gray-900">
                  {profile?.first_name || user.email?.split('@')[0]}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {(profile?.first_name?.[0] || user.email?.charAt(0) || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Navigation Pills */}
        <div className="flex items-center gap-2 mb-5">
          <Link
            href="/dashboard/courses?view=all"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Courses ({totalCourses})
          </Link>
          <Link
            href="/dashboard/courses?view=my"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'my'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            My Courses ({enrolledCount})
          </Link>
        </div>

        {/* Compact Title Section */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'all' ? 'Course Catalog' : 'My Learning'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {viewMode === 'all' 
              ? `${totalCourses} professional development courses`
              : `${enrolledCount} enrolled courses`}
          </p>
        </div>

        {/* Search Bar - Compact */}
        {viewMode === 'all' && (
          <div className="mb-6">
            <form className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search courses..."
                className="w-full pl-9 pr-24 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-xs font-medium"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Empty State */}
        {viewMode === 'my' && courses.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="text-gray-400" size={20} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No enrolled courses</h3>
            <p className="text-sm text-gray-500 mb-4">Browse our catalog to find courses that interest you.</p>
            <Link
              href="/dashboard/courses?view=all"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Browse Courses
            </Link>
          </div>
        )}

        {(viewMode === 'all' || courses.length > 0) && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters - Compact */}
            {viewMode === 'all' && (
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                      <Filter size={14} className="text-gray-500" />
                      Filters
                    </h2>
                    {(searchParams.category || searchParams.difficulty || searchParams.search) && (
                      <Link
                        href="/dashboard/courses?view=all"
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </Link>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
                    <div className="space-y-0.5">
                      <Link
                        href="/dashboard/courses?view=all"
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
                          currentCategory === 'all' && viewMode === 'all'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <BookOpen size={14} className={currentCategory === 'all' ? 'text-blue-600' : 'text-gray-400'} />
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
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={14} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                            <span className="flex-1 truncate">{category.name}</span>
                            <span className="text-xs text-gray-400">{count}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</h3>
                    <div className="flex flex-wrap gap-1.5">
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
                            className={`px-2.5 py-1 rounded-md text-xs capitalize transition ${
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
                      <div className="flex flex-wrap gap-1.5">
                        {searchParams.difficulty && (
                          <Link
                            href={`/dashboard/courses?${new URLSearchParams({
                              view: 'all',
                              ...searchParams,
                              difficulty: '',
                            })}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
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
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
                          >
                            {searchParams.search.length > 20 ? searchParams.search.substring(0, 20) + '...' : searchParams.search}
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
                <div className="mb-3">
                  <p className="text-xs text-gray-500">{courses.length} courses</p>
                </div>
              )}

              {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {courses.map((course) => {
                    const isEnrolled = enrolledCourseIds.has(course.id)
                    const courseImage = getCourseImage(course.slug, course.title)
                    
                    return (
                      <Link
                        key={course.id}
                        href={isEnrolled ? `/dashboard/learn/${course.slug}` : `/dashboard/courses/${course.slug}`}
                        className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300"
                      >
                        {/* Course Image with Actual Images */}
                        <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                          <CourseImage
                            src={courseImage}
                            alt={course.title}
                            title={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {course.is_featured && (
                              <span className="bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                                <Star size={10} />
                                Featured
                              </span>
                            )}
                            {isEnrolled && (
                              <span className="bg-emerald-500 text-white text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                                <CheckCircle size={10} />
                                Enrolled
                              </span>
                            )}
                          </div>

                          {/* Difficulty Badge */}
                          {course.difficulty_level && (
                            <div className="absolute bottom-2 left-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium shadow-sm ${
                                difficultyColors[course.difficulty_level as keyof typeof difficultyColors]
                              }`}>
                                {course.difficulty_level}
                              </span>
                            </div>
                          )}
                          
                          {/* Duration Badge */}
                          {course.duration_hours && (
                            <div className="absolute bottom-2 right-2">
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-black/60 text-white backdrop-blur-sm flex items-center gap-0.5">
                                <Clock size={10} />
                                {course.duration_hours}h
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="p-3">
                          <div className="mb-1.5">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {course.category?.split(' ')[0] || 'Course'}
                            </span>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition line-clamp-2 text-sm">
                            {course.title}
                          </h3>

                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {course.short_description || course.description?.substring(0, 70) || 'Start learning today'}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-0.5">
                                <Users size={10} />
                                {course.enrollment_count || 0}
                              </span>
                            </div>
                            <span className="text-blue-600 text-xs font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                              {isEnrolled ? 'Continue' : 'Explore'}
                              <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : viewMode === 'all' ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="text-gray-400" size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No courses found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchParams.search ? `No results for "${searchParams.search}"` : 'Try adjusting your filters'}
                  </p>
                  <Link
                    href="/dashboard/courses?view=all"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Clear filters
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Admin Footer - Compact */}
        {profile?.role === 'admin' && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">Admin</span>
              </div>
              <Link href="/admin/resources" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Manage Resources
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
