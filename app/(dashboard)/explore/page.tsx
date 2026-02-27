'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen } from 'lucide-react'

interface Enrollment {
  id: string
  course_id: string
  progress_percentage: number
  status: string
  enrolled_at: string
  updated_at: string
  courses: {
    title: string
    thumbnail_url: string | null
    duration: string | null
    level: string | null
  } | null
}

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          progress_percentage,
          status,
          enrolled_at,
          updated_at,
          courses:course_id (
            title,
            thumbnail_url,
            duration,
            level
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Learning Progress</h1>
      
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">You haven't enrolled in any courses yet.</p>
            <p className="text-sm text-gray-400">
              Browse courses and start your learning journey!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {enrollment.courses?.title || 'Unknown Course'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{enrollment.progress_percentage}%</span>
                    </div>
                    <Progress value={enrollment.progress_percentage} className="h-2" />
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {enrollment.courses?.duration && (
                      <span className="text-gray-500">
                        Duration: {enrollment.courses.duration}
                      </span>
                    )}
                    {enrollment.courses?.level && (
                      <span className="text-gray-500">
                        Level: {enrollment.courses.level}
                      </span>
                    )}
                    <span className="text-gray-500 capitalize">
                      Status: {enrollment.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Last updated: {new Date(enrollment.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
