import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardStats from '@/components/dashboard/StatsCards'
import CourseProgress from '@/components/courses/CourseProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Award } from 'lucide-react'

// Force dynamic rendering since this page uses cookies() via createServerClient
export const dynamic = 'force-dynamic'

// Loading components
function StatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}

function CoursesLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  )
}

function ActivityLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function StatsContent({ userId }: { userId: string }) {
  const supabase = await createServerClient()
  
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)

  const totalCourses = enrollments?.length || 0
  const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0
  const inProgressCourses = enrollments?.filter(e => e.status === 'in_progress').length || 0
  const averageProgress = enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / (totalCourses || 1)

  const stats = {
    totalCourses,
    completedCourses,
    inProgressCourses,
    averageProgress: Math.round(averageProgress),
    totalStudyTime: 42
  }

  return <DashboardStats stats={stats} />
}

async function CoursesContent({ userId }: { userId: string }) {
  const supabase = await createServerClient()
  
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses(title, instructor)
    `)
    .eq('user_id', userId)
    .limit(4)

  const courses = enrollments?.map(e => ({
    id: parseInt(e.id) || Math.random(),
    title: e.courses?.title || 'Unknown Course',
    progress: e.progress_percentage || 0,
    instructor: e.courses?.instructor || 'Unknown Instructor'
  })) || []

  return <CourseProgress courses={courses} />
}

async function ActivityContent({ userId }: { userId: string }) {
  const supabase = await createServerClient()
  
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quizzes(title)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(5)

  if (!attempts || attempts.length === 0) {
    return <p className="text-sm text-gray-500">No recent activity</p>
  }

  return (
    <div className="space-y-4">
      {attempts.map((attempt) => (
        <div key={attempt.id} className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            attempt.passed ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            <Award className={`w-4 h-4 ${
              attempt.passed ? 'text-green-600' : 'text-yellow-600'
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {attempt.quizzes?.title || 'Quiz'} - Score: {attempt.score}%
            </p>
            <p className="text-xs text-gray-500">
              {new Date(attempt.completed_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function DashboardHomePage() {
  const supabase = await createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}! Here's your learning progress overview.
        </p>
      </div>

      <Suspense fallback={<StatsLoading />}>
        <StatsContent userId={session.user.id} />
      </Suspense>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CoursesLoading />}>
              <CoursesContent userId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ActivityLoading />}>
              <ActivityContent userId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">React Components Assignment</p>
                <p className="text-sm text-gray-600">Web Development Basics</p>
              </div>
              <span className="text-sm text-red-600 font-medium">Due in 2 days</span>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Database Design Quiz</p>
                <p className="text-sm text-gray-600">SQL Fundamentals</p>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Due in 5 days</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
