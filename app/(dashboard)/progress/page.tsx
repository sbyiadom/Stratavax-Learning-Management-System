'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface Enrollment {
  id: string
  course_id: string
  progress_percentage: number
  status: string
  enrolled_at: string
  courses: {
    title: string
    thumbnail_url: string | null
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
          courses:course_id (
            title,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })
      
      if (error) throw error
      
      // Use type assertion with 'as' keyword
      if (data) {
        setEnrollments(data as unknown as Enrollment[])
      } else {
        setEnrollments([])
      }
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
      <h1 className="text-2xl font-bold">My Progress</h1>
      
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">You haven't enrolled in any courses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle>{enrollment.courses?.title || 'Unknown Course'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{enrollment.progress_percentage}%</span>
                  </div>
                  <Progress value={enrollment.progress_percentage} className="h-2" />
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500 capitalize">
                      Status: {enrollment.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </span>
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
