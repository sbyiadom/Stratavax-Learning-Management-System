'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Star,
  Users,
  Sparkles
} from 'lucide-react'

interface Enrollment {
  id: string
  course_id: string
  progress_percentage: number
  status: string
  enrolled_at: string
  completed_at: string | null
  courses: {
    id: string
    title: string
    slug: string
    duration_hours: number | null
    difficulty_level: string | null
    category: string | null
    thumbnail_url: string | null
  } | null
}

interface LessonProgress {
  lesson_id: string
  completed: boolean
  updated_at: string
}

interface Certificate {
  id: string
  course_id: string
  issued_at: string
  certificate_id?: string
}

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()
        
        if (profile && isMounted) {
          const firstName = profile.first_name || user.email?.split('@')[0] || 'Learner'
          const lastName = profile.last_name || ''
          setUserName(`${firstName} ${lastName}`.trim())
        }

        // Get enrollments with course details
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            progress_percentage,
            status,
            enrolled_at,
            completed_at,
            courses:course_id (
              id,
              title,
              slug,
              duration_hours,
              difficulty_level,
              category,
              thumbnail_url
            )
          `)
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false })
        
        if (enrollError) throw enrollError
        
        if (enrollData && isMounted) {
          setEnrollments(enrollData as unknown as Enrollment[])
        }

        // Get lesson progress
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed, updated_at')
          .eq('user_id', user.id)
        
        if (progressData && isMounted) {
          setLessonProgress(progressData as LessonProgress[])
        }

        // Get certificates
        const { data: certData } = await supabase
          .from('certificates')
          .select('id, course_id, issued_at, certificate_id')
          .eq('user_id', user.id)
        
        if (certData && isMounted) {
          setCertificates(certData as Certificate[])
        }

      } catch (error) {
        console.error('Error fetching progress:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProgress()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate statistics
  const validEnrollments = enrollments.filter(e => e.courses)
  const totalCourses = validEnrollments.length
  const completedCourses = validEnrollments.filter(e => e.progress_percentage === 100 || e.status === 'completed').length
  const inProgressCourses = validEnrollments.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100).length
  const notStartedCourses = validEnrollments.filter(e => e.progress_percentage === 0).length
  
  const totalLessonsCompleted = lessonProgress.filter(p => p.completed).length || 0
  const totalLessons = lessonProgress.length || 0
  const overallProgress = totalLessons > 0 ? Math.round((totalLessonsCompleted / totalLessons) * 100) : 0
  
  const totalCertificates = certificates.length || 0
  
  // Calculate average progress per course
  const averageProgress = totalCourses > 0 
    ? Math.round(validEnrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / totalCourses) 
    : 0

  // Get recent activity (last 5 completed lessons)
  const recentActivity = lessonProgress
    .filter(p => p.completed)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  // Get certificate map for quick lookup
  const certificateMap: Record<string, Certificate> = {}
  certificates.forEach(c => {
    certificateMap[c.course_id] = c
  })

  // Monthly activity data
  const monthlyActivity = [
    { month: 'Mar', completed: 0 },
    { month: 'Apr', completed: 0 },
    { month: 'May', completed: 0 },
    { month: 'Jun', completed: 0 },
    { month: 'Jul', completed: 0 },
    { month: 'Aug', completed: 0 },
  ]
  
  validEnrollments.forEach(e => {
    if (e.completed_at) {
      const date = new Date(e.completed_at)
      const month = date.toLocaleString('default', { month: 'short' })
      const found = monthlyActivity.find(m => m.month === month)
      if (found) found.completed++
    }
  })
  
  const maxActivity = Math.max(...monthlyActivity.map(m => m.completed), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
              <p className="text-gray-600 mt-1">Track your learning journey, {userName || 'Learner'}</p>
            </div>
            <Link 
              href="/dashboard/courses"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
            >
              <BookOpen size={16} />
              Browse Courses
            </Link>
          </div>
        </div>

        {totalCourses === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No progress yet</h3>
            <p className="text-gray-500 mb-6">Enroll in a course to start tracking your progress</p>
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Browse Courses
              <ChevronRight size={18} className="ml-2" />
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs">Total Courses</p>
                    <p className="text-2xl font-bold">{totalCourses}</p>
                  </div>
                  <BookOpen size={24} className="text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs">Completed</p>
                    <p className="text-2xl font-bold">{completedCourses}</p>
                  </div>
                  <CheckCircle size={24} className="text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-xs">In Progress</p>
                    <p className="text-2xl font-bold">{inProgressCourses}</p>
                  </div>
                  <PlayCircle size={24} className="text-yellow-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs">Certificates</p>
                    <p className="text-2xl font-bold">{totalCertificates}</p>
                  </div>
                  <Award size={24} className="text-purple-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs">Avg. Progress</p>
                    <p className="text-2xl font-bold">{averageProgress}%</p>
                  </div>
                  <TrendingUp size={24} className="text-orange-200" />
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">Overall Learning Progress</h3>
                <span className="text-sm font-medium text-gray-600">{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{totalLessonsCompleted} of {totalLessons} lessons completed</span>
                <span>{validEnrollments.reduce((acc, e) => acc + (e.courses?.duration_hours || 0), 0)} total hours</span>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-gray-500" />
                Monthly Activity
              </h3>
              <div className="flex items-end gap-3 h-32">
                {monthlyActivity.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                      style={{ 
                        height: `${(item.completed / maxActivity) * 100}%`,
                        minHeight: item.completed > 0 ? '4px' : '2px'
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                    <span className="text-xs font-medium text-gray-700">{item.completed}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">Courses completed per month</p>
            </div>

            {/* Course Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-gray-500" />
                Course Distribution
              </h3>
              <div className="flex h-8 rounded-lg overflow-hidden">
                {completedCourses > 0 && (
                  <div 
                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(completedCourses / totalCourses) * 100}%` }}
                  >
                    {Math.round((completedCourses / totalCourses) * 100)}%
                  </div>
                )}
                {inProgressCourses > 0 && (
                  <div 
                    className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${(inProgressCourses / totalCourses) * 100}%` }}
                  >
                    {Math.round((inProgressCourses / totalCourses) * 100)}%
                  </div>
                )}
                {notStartedCourses > 0 && (
                  <div 
                    className="bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-medium"
                    style={{ width: `${(notStartedCourses / totalCourses) * 100}%` }}
                  >
                    {Math.round((notStartedCourses / totalCourses) * 100)}%
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Completed ({completedCourses})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>In Progress ({inProgressCourses})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>Not Started ({notStartedCourses})</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-gray-500" />
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => {
                    const enrollment = validEnrollments.find(e => 
                      e.courses && lessonProgress.some(lp => lp.lesson_id === activity.lesson_id)
                    )
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-green-500" />
                          <div>
                            <p className="font-medium text-gray-900">Lesson Completed</p>
                            <p className="text-sm text-gray-500">{enrollment?.courses?.title || 'Course'}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(activity.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Course Progress Cards */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              Course Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {validEnrollments.map((enrollment) => {
                const course = enrollment.courses
                const progress = enrollment.progress_percentage || 0
                const isCompleted = enrollment.status === 'completed' || progress === 100
                const hasCertificate = certificateMap[enrollment.course_id]
                
                return (
                  <div
                    key={enrollment.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200 group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link href={`/dashboard/learn/${course?.slug}`}>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                              {course?.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                              {course?.difficulty_level || 'Beginner'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {course?.category || 'Course'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isCompleted ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                          ) : progress > 0 ? (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <PlayCircle size={16} />
                              <span className="text-sm font-medium">In Progress</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock size={16} />
                              <span className="text-sm font-medium">Not Started</span>
                            </div>
                          )}
                          {hasCertificate && (
                            <Link 
                              href={`/dashboard/certificates/${course?.slug}`}
                              className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-amber-200 transition"
                            >
                              <Award size={12} />
                              Certificate
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{course?.duration_hours || 0}h total</span>
                        </div>
                      </div>
                      
                      {enrollment.completed_at && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <Award size={12} />
                            <span>Completed on {new Date(enrollment.completed_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/dashboard/learn/${course?.slug}`}
                          className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          {isCompleted ? 'Review Course' : 'Continue'}
                        </Link>
                        {isCompleted && hasCertificate && (
                          <Link
                            href={`/dashboard/certificates/${course?.slug}`}
                            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition text-sm flex items-center gap-1"
                          >
                            <Award size={14} />
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
