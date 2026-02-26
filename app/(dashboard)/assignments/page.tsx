'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes(title, lesson_id),
          courses(title)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
      
      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assignments</h1>
      
      <div className="grid gap-4">
        {assignments.map((assignment: any) => (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle>{assignment.quizzes?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Course: {assignment.courses?.title}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Score: {assignment.score}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Completed: {new Date(assignment.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/learn/${assignment.course_id}/${assignment.quizzes?.lesson_id}`}>
                    Review
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
