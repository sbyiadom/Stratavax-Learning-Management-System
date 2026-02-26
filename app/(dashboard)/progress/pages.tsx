'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(title, thumbnail_url)
        `)
        .eq('user_id', user.id)
      
      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Progress</h1>
      
      <div className="grid gap-4">
        {enrollments.map((enrollment: any) => (
          <Card key={enrollment.id}>
            <CardHeader>
              <CardTitle>{enrollment.courses?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{enrollment.progress_percentage}%</span>
                </div>
                <Progress value={enrollment.progress_percentage} />
                <p className="text-sm text-gray-500 mt-2">
                  Status: {enrollment.status}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
