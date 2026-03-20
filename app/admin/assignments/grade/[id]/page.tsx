'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircle, Download, Eye, ChevronLeft } from 'lucide-react'

type UserProfile = {
  full_name: string
  email: string
  department: string | null
}

type Assignment = {
  title: string
  description: string
  solution_text: string | null
  solution_file_url: string | null
  grading_rubric: Record<string, { max_points: number; criteria: string }>
  points: number
  passing_score: number
}

type Submission = {
  id: string
  user_id: string
  assignment_id: string
  status: string
  submission_text: string | null
  submission_url: string | null
  submitted_at: string
  grade: number | null
  feedback: string | null
  profiles: {
    first_name: string
    last_name: string
    email: string
    department: string | null
  }
  assignments: Assignment
}

export default function GradeAssignmentPage({ params }: { params: { id: string } }) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [grades, setGrades] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSubmission()
  }, [])

  const loadSubmission = async () => {
    const { data } = await supabase
      .from('user_assignments')
      .select(`
        *,
        profiles!inner(
          first_name,
          last_name,
          email,
          department
        ),
        assignments!inner(
          title, 
          description, 
          solution_text, 
          solution_file_url,
          grading_rubric,
          points,
          passing_score
        )
      `)
      .eq('id', params.id)
      .single() as any

    if (data) {
      setSubmission(data as Submission)
      
      // Initialize grades from rubric
      const rubric = (data as any).assignments.grading_rubric
      if (rubric) {
        const initialGrades: Record<string, number> = {}
        Object.keys(rubric).forEach(key => {
          initialGrades[key] = 0
        })
        setGrades(initialGrades)
      }
    }
    setLoading(false)
  }

  const calculateTotal = () => {
    return Object.values(grades).reduce((sum, grade) => sum + grade, 0)
  }

  const handleSubmitGrade = async () => {
    if (!submission) return
    
    setSubmitting(true)
    
    const total = calculateTotal()
    const passed = total >= (submission.assignments.passing_score || 70)

    await supabase
      .from('user_assignments')
      .update({
        grade: total,
        feedback,
        status: passed ? 'passed' : 'failed',
        graded_at: new Date().toISOString()
      } as any)
      .eq('id', params.id)

    router.push('/admin/assignments')
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!submission) return <div className="p-8 text-center">Submission not found</div>

  const assignment = submission.assignments
  const rubric = assignment.grading_rubric
  // Compute full name from first_name and last_name
  const studentName = submission.profiles ? 
    `${submission.profiles.first_name || ''} ${submission.profiles.last_name || ''}`.trim() : 
    'Student'
  const studentEmail = submission.profiles?.email || ''

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={20} />
            <span>Back to Submissions</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Grade Assignment</h1>
          <p className="text-gray-600">{assignment.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Submission */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Student Submission</h2>
              
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="font-medium">{studentName}</p>
                <p className="text-sm text-gray-600">{studentEmail}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>

              {submission.submission_text && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Student's Answer:</h3>
                  <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap">
                    {submission.submission_text}
                  </div>
                </div>
              )}

              {submission.submission_url && (
                <div className="flex gap-2">
                  <a
                    href={submission.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download size={16} />
                    Download Submission
                  </a>
                  <a
                    href={submission.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Eye size={16} />
                    Preview
                  </a>
                </div>
              )}
            </div>

            {/* Model Solution Reference */}
            {assignment.solution_text && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle size={18} />
                  Model Solution
                </h3>
                <div className="text-sm text-green-700 whitespace-pre-wrap">
                  {assignment.solution_text}
                </div>
                {assignment.solution_file_url && (
                  <a
                    href={assignment.solution_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-green-700 hover:text-green-800"
                  >
                    <Download size={16} />
                    Download Solution Files
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Grading Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Grading Rubric</h2>
              
              {rubric && Object.entries(rubric).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <label className="capitalize font-medium">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <span className="text-gray-500">Max {value.max_points}</span>
                  </div>
                  <input
                    type="number"
                    max={value.max_points}
                    min="0"
                    value={grades[key] || 0}
                    onChange={(e) => setGrades({
                      ...grades,
                      [key]: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{value.criteria}</p>
                </div>
              ))}

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total Score</span>
                  <span className={calculateTotal() >= (assignment.passing_score || 70) ? 'text-green-600' : 'text-red-600'}>
                    {calculateTotal()}/{assignment.points}
                  </span>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Feedback to Student</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide constructive feedback..."
                  />
                </div>

                <button
                  onClick={handleSubmitGrade}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Grade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
