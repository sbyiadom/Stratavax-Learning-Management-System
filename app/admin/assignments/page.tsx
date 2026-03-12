'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminAssignmentsPage() {
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  
  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    const supabase = createClient()
    
    // Get all submissions with user and assignment details
    const { data } = await supabase
      .from('user_assignments')
      .select(`
        *,
        user_profiles!inner(full_name, email),
        assignments!inner(title, points, difficulty)
      `)
      .order('submitted_at', { ascending: false })

    setSubmissions(data || [])
  }

  const handleGrade = async (submissionId: string, grade: number, feedback: string) => {
    const supabase = createClient()
    
    await supabase
      .from('user_assignments')
      .update({
        grade,
        feedback,
        status: grade >= 70 ? 'passed' : 'failed',
        graded_at: new Date().toISOString()
      })
      .eq('id', submissionId)

    loadSubmissions()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Assignment Submissions</h1>
      
      <div className="space-y-4">
        {submissions.map((sub: any) => (
          <div key={sub.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">{sub.user_profiles?.full_name}</h3>
                <p className="text-sm text-gray-600">{sub.assignments?.title}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                sub.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                sub.status === 'passed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {sub.status}
              </span>
            </div>
            
            {sub.submission_text && (
              <div className="mt-2 p-3 bg-gray-50 rounded">
                <p className="text-sm">{sub.submission_text}</p>
              </div>
            )}
            
            {sub.submission_url && (
              <a 
                href={sub.submission_url}
                target="_blank"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Download Submission
              </a>
            )}
            
            {sub.status === 'submitted' && (
              <div className="mt-4">
                <input
                  type="number"
                  placeholder="Grade (0-100)"
                  className="border p-2 rounded mr-2"
                  onBlur={(e) => handleGrade(sub.id, parseInt(e.target.value), '')}
                />
              </div>
            )}
            
            {sub.grade && (
              <div className="mt-2">
                <p className="font-medium">Grade: {sub.grade}%</p>
                {sub.feedback && <p className="text-sm">Feedback: {sub.feedback}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
