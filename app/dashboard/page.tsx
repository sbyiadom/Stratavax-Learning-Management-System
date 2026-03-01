'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import DashboardStats from '@/components/dashboard/StatsCards'
import CourseProgress from '@/components/courses/CourseProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Award } from 'lucide-react'

// Define types
interface Course {
  id: number
  title: string
  progress: number
  instructor: string
}

interface Activity {
  id: string
  passed: boolean
  score: number
  completed_at: string
  quizzes: {
    title: string
  } | null
}

interface Stats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  averageProgress: number
  totalStudyTime: number
}

export default function DashboardHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0,
    totalStudyTime: 0
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [userName, setUserName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        if (!isMounted) return

        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')

        // Fetch enrollments
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            *,
            courses(title, instructor)
          `)
          .eq('user_id', user.id)

        if (!isMounted) return

        // Calculate stats
        const totalCourses = enrollments?.length || 0
        const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0
        const inProgressCourses = enrollments?.filter(e => e.status === 'in_progress').length || 0
        const averageProgress = enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / (totalCourses || 1)

        setStats({
          totalCourses,
          completedCourses,
          inProgressCourses,
          averageProgress: Math.round(averageProgress),
          totalStudyTime: 42
        })

        // Set courses for progress display
        const mappedCourses: Course[] = enrollments?.slice(0, 4).map(e => ({
          id: parseInt(e.id) || Math.random(),
          title: e.courses?.title || 'Unknown Course',
          progress: e.progress_percentage || 0,
          instructor: e.courses?.instructor || 'Unknown Instructor'
        })) || []
        
        if (!isMounted) return
        setCourses(mappedCourses)

        // Fetch recent activity
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            quizzes(title)
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5)
        
        if (!isMounted) return
        setActivities(attempts || [])

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {userName}! Here's your learning progress overview.
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
            <CourseProgress courses={courses} />
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
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {activities.map((attempt) => (
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
