'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Define the exact shape of the data from Supabase
interface QuizAttempt {
  id: string
  quiz_id: string
  course_id: string
  score: number
  passed: boolean
  completed_at: string
  quizzes: {
    title: string
    lesson_id: string
  } | null
  courses: {
    title: string
  } | null
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchAssignments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(`
            id,
            quiz_id,
            course_id,
            score,
            passed,
            completed_at,
            quizzes:quiz_id (
              title,
              lesson_id
            ),
            courses:course_id (
              title
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
        
        if (error) throw error
        
        if (data && isMounted) {
          setAssignments(data as unknown as QuizAttempt[])
        } else if (isMounted) {
          setAssignments([])
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAssignments()

    return () => {
      isMounted = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assignments & Quizzes</h1>
      
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">No assignments completed yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.quizzes?.title || 'Untitled Quiz'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Course: {assignment.courses?.title || 'Unknown Course'}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${assignment.passed ? 'text-green-600' : 'text-red-600'}`}>
                      Score: {assignment.score}% {assignment.passed ? '(Passed)' : '(Failed)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Completed: {new Date(assignment.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/learn/${assignment.course_id}/${assignment.quizzes?.lesson_id || ''}`}>
                      Review
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
