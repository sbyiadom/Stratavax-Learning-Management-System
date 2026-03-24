// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, Clock, Award, TrendingUp, PlayCircle, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }
  
  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()
  
  // Get user's enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses:course_id (
        id,
        title,
        slug,
        thumbnail_url,
        duration_hours,
        difficulty_level,
        category
      )
    `)
    .eq('user_id', user.id)
  
  // Get user's progress stats
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', user.id)
  
  const completedLessons = lessonProgress?.filter(p => p.completed).length || 0
  const totalLessons = lessonProgress?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Get certificates earned
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
  
  const firstName = profile?.first_name || user.email?.split('@')[0] || 'Learner'
  
  // Get recently accessed lessons
  const { data: recentProgress } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      lessons:lesson_id (
        id,
        title,
        module_id,
        modules:module_id (
          course_id,
          courses:course_id (
            id,
            title,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
          <p className="text-gray-600 mt-1">Continue your learning journey where you left off</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{enrollments?.length || 0}</p>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
                <p className="text-sm text-gray-500">Overall Progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Award className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{certificates?.length || 0}</p>
                <p className="text-sm text-gray-500">Certificates Earned</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedLessons}</p>
                <p className="text-sm text-gray-500">Lessons Completed</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Continue Learning Section */}
        {recentProgress && recentProgress.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
              <Link href="/dashboard/learn" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentProgress.map((progress: any) => {
                const course = progress.lessons?.modules?.courses
                if (!course) return null
                
                return (
                  <Link
                    key={progress.id}
                    href={`/dashboard/learn/${course.slug}/${progress.lesson_id}`}
                    className="block bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition hover:border-blue-200"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <PlayCircle className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">{course.title}</p>
                          <p className="font-medium text-gray-900 truncate">{progress.lessons?.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {progress.completed ? 'Completed' : 'In Progress'}
                        </span>
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
        
        {/* My Courses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
            <Link href="/dashboard/courses" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              Browse All <ChevronRight size={16} />
            </Link>
          </div>
          
          {enrollments && enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => {
                const course = enrollment.courses
                if (!course) return null
                
                return (
                  <Link
                    key={enrollment.course_id}
                    href={`/dashboard/learn/${course.slug}`}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group border border-gray-100"
                  >
                    <div className="h-36 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-white text-3xl opacity-30">
                        {course.category === 'Business & Entrepreneurship' && '🚀'}
                        {course.category === 'Data Science & AI' && '🤖'}
                        {course.category === 'Programming & Development' && '👨‍💻'}
                        {course.category === 'Web Development' && '🌐'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-blue-600 font-medium">
                          {enrollment.progress_percentage || 0}% Complete
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {course.duration_hours || 0}h
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Start your learning journey by enrolling in a course</p>
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Browse Courses
                <ChevronRight size={18} className="ml-2" />
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Achievements */}
        {certificates && certificates.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Achievements</h2>
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center gap-4 flex-wrap">
                <Award className="text-yellow-600" size={32} />
                <div>
                  <p className="font-semibold text-gray-900">You've earned {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}!</p>
                  <p className="text-sm text-gray-600">Keep up the great work and continue learning</p>
                </div>
                <Link
                  href="/dashboard/certificates"
                  className="ml-auto text-yellow-700 hover:text-yellow-800 text-sm font-medium"
                >
                  View Certificates →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
