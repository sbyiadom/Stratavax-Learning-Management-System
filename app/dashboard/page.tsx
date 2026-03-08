'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, ChevronRight, Award, Users, TrendingUp, CheckCircle } from 'lucide-react'

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  category: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
  duration_hours: number | null
  enrollment_count: number | null
  is_featured: boolean | null
  icon?: string
}

type Enrollment = {
  course_id: string
  progress_percentage: number
  status: string
  completed_at: string | null
  course: Course
}

type CourseWithCategory = Course & {
  category_name?: string
  category_id?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0
  })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch all published courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('title')

      if (coursesError) {
        console.error('Courses error:', coursesError)
      }

      if (courses) {
        setAllCourses(courses)
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(courses.map(c => c.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      }

      // Fetch user enrollments with course details
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          progress_percentage,
          status,
          completed_at,
          course:courses(*)
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })

      if (enrollmentsError) {
        console.error('Enrollments error:', enrollmentsError)
      }

      if (enrollmentsData) {
        // Transform the data to match the Enrollment type
        // Supabase returns course as an array, but we need it as a single object
        const transformedEnrollments: Enrollment[] = enrollmentsData.map((item: any) => ({
          course_id: item.course_id,
          progress_percentage: item.progress_percentage,
          status: item.status,
          completed_at: item.completed_at,
          course: Array.isArray(item.course) ? item.course[0] : item.course
        }))
        
        setEnrollments(transformedEnrollments)

        // Calculate stats
        const completedCourses = transformedEnrollments.filter(e => e.completed_at).length
        
        // Get all lesson progress for this user
        const enrolledCourseIds = transformedEnrollments.map(e => e.course_id)
        
        if (enrolledCourseIds.length > 0) {
          // First get all modules for enrolled courses
          const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id')
            .in('course_id', enrolledCourseIds)

          if (modulesError) {
            console.error('Modules error:', modulesError)
          }

          if (modules && modules.length > 0) {
            const moduleIds = modules.map(m => m.id)

            // Get all lessons in enrolled courses
            const { data: lessons, error: lessonsError } = await supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds)
              .eq('is_published', true)

            if (lessonsError) {
              console.error('Lessons error:', lessonsError)
            }

            const totalLessons = lessons?.length || 0

            // Get completed lessons
            if (lessons && lessons.length > 0) {
              const { data: completedLessons, error: progressError } = await supabase
                .from('lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('completed', true)
                .in('lesson_id', lessons.map(l => l.id))

              if (progressError) {
                console.error('Progress error:', progressError)
              }

              setStats({
                totalEnrolled: transformedEnrollments.length,
                completedCourses,
                totalLessons,
                completedLessons: completedLessons?.length || 0
              })
            } else {
              setStats({
                totalEnrolled: transformedEnrollments.length,
                completedCourses,
                totalLessons: 0,
                completedLessons: 0
              })
            }
          } else {
            setStats({
              totalEnrolled: transformedEnrollments.length,
              completedCourses,
              totalLessons: 0,
              completedLessons: 0
            })
          }
        } else {
          setStats({
            totalEnrolled: 0,
            completedCourses: 0,
            totalLessons: 0,
            completedLessons: 0
          })
        }
      }

      setLoading(false)
    }

    loadUserData()
  }, [supabase])

  // FIXED: Added courseSlug parameter and use it for redirect
  const handleEnroll = async (courseId: string, courseSlug: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: 'active',
        progress_percentage: 0
      })

    if (!error) {
      // Use the slug, not the ID
      router.push(`/dashboard/learn/${courseSlug}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  // Get enrolled course IDs
  const enrolledCourseIds = enrollments.map(e => e.course_id)
  
  // Filter courses by category
  const filteredCourses = selectedCategory === 'all'
    ? allCourses
    : allCourses.filter(course => course.category === selectedCategory)

  // Separate featured courses
  const featuredCourses = allCourses.filter(c => c.is_featured).slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Learning Platform</h1>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Beta
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.email}!</h2>
          <p className="text-blue-100 mb-4">
            Continue your learning journey. You have access to {allCourses.length}+ courses.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
              {stats.totalEnrolled} courses enrolled
            </span>
            <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
              {stats.completedLessons}/{stats.totalLessons} lessons completed
            </span>
            <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
              {stats.completedCourses} courses completed
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
                <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Lessons</p>
                <p className="text-2xl font-bold">{stats.completedLessons}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Courses</p>
                <p className="text-2xl font-bold">{stats.completedCourses}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Award className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Progress</p>
                <p className="text-2xl font-bold">
                  {stats.totalLessons > 0 
                    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Continue Learning Section */}
        {enrollments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BookOpen className="mr-2" size={24} />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.slice(0, 3).map((enrollment) => (
                <div key={enrollment.course_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  {enrollment.course.thumbnail_url ? (
                    <img 
                      src={enrollment.course.thumbnail_url} 
                      alt={enrollment.course.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <BookOpen size={48} className="text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        {enrollment.status === 'active' ? 'In Progress' : 'Completed'}
                      </span>
                      <span className="text-xs text-gray-500">{enrollment.course.difficulty_level || 'Beginner'}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{enrollment.course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {enrollment.course.short_description || enrollment.course.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{enrollment.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/learn/${enrollment.course.slug}`)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      Continue Learning
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {enrollments.length > 3 && (
              <div className="text-center mt-4">
                <Link href="/dashboard/my-courses" className="text-blue-600 hover:underline">
                  View all {enrollments.length} enrolled courses →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Featured Courses */}
        {featuredCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Award className="mr-2" size={24} />
              Featured Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.includes(course.id)
                return (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <BookOpen size={48} className="text-white opacity-50" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          Featured
                        </span>
                        <span className="text-xs text-gray-500">{course.difficulty_level || 'Beginner'}</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.short_description || course.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {course.duration_hours || 0}h
                        </span>
                        <span className="flex items-center">
                          <Users size={14} className="mr-1" />
                          {course.enrollment_count || 0} enrolled
                        </span>
                      </div>
                      {isEnrolled ? (
                        <button
                          onClick={() => router.push(`/dashboard/learn/${course.slug}`)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Continue Learning
                        </button>
                      ) : (
                        // FIXED: Pass both course.id and course.slug to handleEnroll
                        <button
                          onClick={() => handleEnroll(course.id, course.slug)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Browse All Courses</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id)
            const enrollment = enrollments.find(e => e.course_id === course.id)
            
            return (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className={`w-full h-40 bg-gradient-to-r ${
                    course.is_featured 
                      ? 'from-purple-500 to-pink-600' 
                      : 'from-blue-500 to-indigo-600'
                  } flex items-center justify-center`}>
                    <BookOpen size={48} className="text-white opacity-50" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      isEnrolled 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-blue-600 bg-blue-50'
                    }`}>
                      {isEnrolled ? 'Enrolled' : course.difficulty_level || 'Beginner'}
                    </span>
                    {course.category && (
                      <span className="text-xs text-gray-500">{course.category}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.short_description || course.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock size={14} className="mr-1" />
                    {course.duration_hours || 0} hours
                  </div>
                  
                  {isEnrolled ? (
                    <>
                      {enrollment && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{enrollment.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/learn/${course.slug}`)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                      >
                        {enrollment?.progress_percentage === 100 ? 'Review Course' : 'Continue Learning'}
                        <ChevronRight size={16} className="ml-1" />
                      </button>
                    </>
                  ) : (
                    // FIXED: Pass both course.id and course.slug to handleEnroll
                    <button
                      onClick={() => handleEnroll(course.id, course.slug)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'No courses are available yet. Check back soon!' 
                : `No courses available in ${selectedCategory} category.`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
