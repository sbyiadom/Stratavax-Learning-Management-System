import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardStats from '@/components/dashboard/StatsCards'
import CourseProgress from '@/components/courses/CourseProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Award } from 'lucide-react'

export default async function DashboardHomePage() {
  const supabase = await createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Fetch real data from Supabase
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses(title, instructor)
    `)
    .eq('user_id', session.user.id)

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quizzes(title)
    `)
    .eq('user_id', session.user.id)
    .order('completed_at', { ascending: false })
    .limit(5)

  // Calculate stats
  const totalCourses = enrollments?.length || 0
  const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0
  const inProgressCourses = enrollments?.filter(e => e.status === 'in_progress').length || 0
  const averageProgress = enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / (totalCourses || 1)

  const mockCourses = enrollments?.slice(0, 4).map(e => ({
    id: parseInt(e.id) || Math.random(),
    title: e.courses?.title || 'Unknown Course',
    progress: e.progress_percentage || 0,
    instructor: e.courses?.instructor || 'Unknown Instructor'
  })) || []

  const stats = {
    totalCourses,
    completedCourses,
    inProgressCourses,
    averageProgress: Math.round(averageProgress),
    totalStudyTime: 42 // You can calculate this from course durations
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}! Here's your learning progress overview.
        </p>
      </div>

      <DashboardStats stats={stats} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CourseProgress courses={mockCourses} />
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
            {!attempts || attempts.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
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
            )}
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
