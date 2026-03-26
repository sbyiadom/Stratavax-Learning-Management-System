import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, Clock, Award, TrendingUp, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .maybeSingle()
  
  // Get ONLY the courses the user is enrolled in
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      course_id,
      progress_percentage,
      courses:course_id (
        id,
        title,
        slug,
        duration_hours,
        category,
        difficulty_level,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)  // Only this user's enrollments
  
  // Get certificates earned (only this user's)
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
  
  // Get lesson progress (only this user's)
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', user.id)
  
  const completedLessons = lessonProgress?.filter(p => p.completed).length || 0
  const totalLessons = lessonProgress?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Get user's name
  const firstName = profile?.first_name || user.email?.split('@')[0] || 'Learner'
  
  // Filter valid enrollments (with course data)
  const validEnrollments = enrollments?.filter(e => e.courses) || []
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {firstName}!
          </h1>
          <p className="text-gray-600 mt-1">Continue your learning journey where you left off</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{validEnrollments.length}</p>
                <p className="text-sm text-gray-500">Enrolled Courses</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{progressPercentage}%</p>
                <p className="text-sm text-gray-500">Overall Progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Award className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                <p className="text-sm text-gray-500">Certificates Earned</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedLessons}</p>
                <p className="text-sm text-gray-500">Lessons Completed</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* My Courses - Only shows courses the user is enrolled in */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Link href="/dashboard/courses" className="text-blue-600 text-sm flex items-center gap-1">
              Browse All Courses <ChevronRight size={16} />
            </Link>
          </div>
          
          {validEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {validEnrollments.map((enrollment: any) => (
                <Link
                  key={enrollment.id}
                  href={`/dashboard/learn/${enrollment.courses.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${enrollment.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{enrollment.courses.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 capitalize">{enrollment.courses.difficulty_level || 'Beginner'}</span>
                      <span className="text-xs text-gray-500">{enrollment.courses.category || 'Course'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-blue-600">{enrollment.progress_percentage || 0}% Complete</span>
                      <span className="text-xs text-gray-400">{enrollment.courses.duration_hours || 0}h</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
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
      </div>
    </div>
  )
}
