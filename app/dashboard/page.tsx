import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { BookOpen, Clock, Award, TrendingUp, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get current user with better error handling
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Log for debugging
  console.log('Dashboard - User:', user?.email)
  console.log('Dashboard - Auth Error:', userError)
  
  // If no user, redirect to login
  if (!user || userError) {
    console.log('No user found, redirecting to login')
    redirect('/login')
  }
  
  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .maybeSingle()
  
  console.log('Dashboard - Profile:', profile)
  console.log('Dashboard - Profile Error:', profileError)
  
  // Get user's enrolled courses
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
        duration_hours
      )
    `)
    .eq('user_id', user.id)
  
  // Get lesson progress
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', user.id)
  
  const completedLessons = lessonProgress?.filter(p => p.completed).length || 0
  const totalLessons = lessonProgress?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Get user's name
  let displayName = 'Learner'
  if (profile) {
    if (profile.first_name) {
      displayName = profile.first_name
    }
  } else {
    displayName = user.email?.split('@')[0] || 'Learner'
  }
  
  console.log('Dashboard - Display Name:', displayName)
  
  const validEnrollments = enrollments?.filter(e => e.courses) || []
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {displayName}!
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
                <p className="text-2xl font-bold">0</p>
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
        
        {/* My Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Link href="/dashboard/courses" className="text-blue-600 text-sm flex items-center gap-1">
              Browse All <ChevronRight size={16} />
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
                    <h3 className="font-semibold mb-1">{enrollment.courses.title}</h3>
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
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <Link href="/dashboard/courses" className="text-blue-600 hover:underline">
                Browse Courses →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
