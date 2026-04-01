'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Save, TrendingUp, AlertCircle, CheckCircle, FileText, Printer, Calculator, ArrowUp, ArrowDown } from 'lucide-react'

interface KnowledgeAssessmentProps {
  registrationId: string
  courseTitle: string
  userId: string
  onSaved?: () => void
}

interface AssessmentData {
  id?: string
  registration_id: string
  staff_number: string
  name_surname: string
  job_title: string
  plant: string
  department: string
  pass_mark: number
  pre_assessment_score: number | null
  post_assessment_score: number | null
  possible_score: number
  pre_assessment_date: string | null
  post_assessment_date: string | null
  retest: boolean
  commentary: string
}

export default function KnowledgeAssessment({ registrationId, courseTitle, userId, onSaved }: KnowledgeAssessmentProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<AssessmentData>({
    registration_id: registrationId,
    staff_number: '',
    name_surname: '',
    job_title: '',
    plant: '',
    department: '',
    pass_mark: 70,
    pre_assessment_score: null,
    post_assessment_score: null,
    possible_score: 100,
    pre_assessment_date: null,
    post_assessment_date: null,
    retest: false,
    commentary: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchAssessment()
    fetchUserProfile()
  }, [registrationId])

  const fetchUserProfile = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()
    
    if (profile) {
      setAssessment(prev => ({
        ...prev,
        name_surname: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      }))
    }
  }

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_assessments')
        .select('*')
        .eq('registration_id', registrationId)
        .maybeSingle()

      if (data && !error) {
        setAssessment({
          ...assessment,
          id: data.id,
          staff_number: data.staff_number || '',
          name_surname: data.name_surname || '',
          job_title: data.job_title || '',
          plant: data.plant || '',
          department: data.department || '',
          pass_mark: data.pass_mark || 70,
          pre_assessment_score: data.pre_assessment_score,
          post_assessment_score: data.post_assessment_score,
          possible_score: data.possible_score || 100,
          pre_assessment_date: data.pre_assessment_date,
          post_assessment_date: data.post_assessment_date,
          retest: data.retest || false,
          commentary: data.commentary || ''
        })
      }
    } catch (err) {
      console.error('Error fetching assessment:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateDifference = (): number | null => {
    if (assessment.pre_assessment_score === null || assessment.post_assessment_score === null) {
      return null
    }
    return assessment.post_assessment_score - assessment.pre_assessment_score
  }

  const calculatePercentageShift = (): number | null => {
    if (assessment.pre_assessment_score === null || assessment.post_assessment_score === null) {
      return null
    }
    const difference = assessment.post_assessment_score - assessment.pre_assessment_score
    const percentageShift = (difference / assessment.possible_score) * 100
    return parseFloat(percentageShift.toFixed(2))
  }

  const difference = calculateDifference()
  const percentageShift = calculatePercentageShift()
  const hasImprovement = difference !== null && difference > 0

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const needsRetest = assessment.post_assessment_score !== null && 
                         assessment.post_assessment_score < assessment.pass_mark

      const assessmentData = {
        registration_id: registrationId,
        user_id: userId,
        course_title: courseTitle,
        staff_number: assessment.staff_number,
        name_surname: assessment.name_surname,
        job_title: assessment.job_title,
        plant: assessment.plant,
        department: assessment.department,
        pass_mark: assessment.pass_mark,
        pre_assessment_score: assessment.pre_assessment_score,
        post_assessment_score: assessment.post_assessment_score,
        possible_score: assessment.possible_score,
        pre_assessment_date: assessment.pre_assessment_score ? new Date().toISOString() : null,
        post_assessment_date: assessment.post_assessment_score ? new Date().toISOString() : null,
        retest: needsRetest,
        commentary: assessment.commentary
      }

      const { error } = await supabase
        .from('knowledge_assessments')
        .upsert(assessmentData, { onConflict: 'registration_id' })

      if (error) throw error

      setSuccess('Assessment saved successfully!')
      onSaved?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save assessment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse p-6"><div className="h-32 bg-gray-200 rounded"></div></div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Knowledge Assessment Results Sheet
            </h2>
            <p className="text-blue-100 text-sm mt-1">{courseTitle}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Employee Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Staff Number</label>
            <input
              type="text"
              value={assessment.staff_number}
              onChange={(e) => setAssessment({ ...assessment, staff_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., STAFF001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name & Surname</label>
            <input
              type="text"
              value={assessment.name_surname}
              onChange={(e) => setAssessment({ ...assessment, name_surname: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
            <input
              type="text"
              value={assessment.job_title}
              onChange={(e) => setAssessment({ ...assessment, job_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Engineer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Plant</label>
            <input
              type="text"
              value={assessment.plant}
              onChange={(e) => setAssessment({ ...assessment, plant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Plant A"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <input
              type="text"
              value={assessment.department}
              onChange={(e) => setAssessment({ ...assessment, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Engineering"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pass Mark (%)</label>
            <input
              type="number"
              value={assessment.pass_mark}
              onChange={(e) => setAssessment({ ...assessment, pass_mark: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Assessment Scores Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Assessment Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Possible Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Pre-Assessment</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={assessment.pre_assessment_score || ''}
                    onChange={(e) => setAssessment({ 
                      ...assessment, 
                      pre_assessment_score: e.target.value ? parseInt(e.target.value) : null,
                      pre_assessment_date: e.target.value ? new Date().toISOString() : null
                    })}
                    className="w-24 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min="0"
                    max={assessment.possible_score}
                    placeholder="Score"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{assessment.possible_score}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {assessment.pre_assessment_date ? new Date(assessment.pre_assessment_date).toLocaleDateString() : '-'}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Post-Assessment</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={assessment.post_assessment_score || ''}
                    onChange={(e) => setAssessment({ 
                      ...assessment, 
                      post_assessment_score: e.target.value ? parseInt(e.target.value) : null,
                      post_assessment_date: e.target.value ? new Date().toISOString() : null
                    })}
                    className="w-24 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min="0"
                    max={assessment.possible_score}
                    placeholder="Score"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{assessment.possible_score}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {assessment.post_assessment_date ? new Date(assessment.post_assessment_date).toLocaleDateString() : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Results Analysis */}
        {(assessment.pre_assessment_score !== null || assessment.post_assessment_score !== null) && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Knowledge Improvement Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Pre-Assessment Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessment.pre_assessment_score !== null ? `${assessment.pre_assessment_score}%` : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Post-Assessment Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessment.post_assessment_score !== null ? `${assessment.post_assessment_score}%` : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Difference</p>
                <div className="flex items-center justify-center gap-1">
                  {difference !== null && (
                    <>
                      {hasImprovement ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-red-600" />}
                      <p className={`text-2xl font-bold ${hasImprovement ? 'text-green-600' : 'text-red-600'}`}>
                        {difference > 0 ? '+' : ''}{difference}
                      </p>
                    </>
                  )}
                  {difference === null && <p className="text-2xl font-bold text-gray-400">-</p>}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">% Shift Improvement</p>
                <p className={`text-2xl font-bold ${hasImprovement ? 'text-green-600' : 'text-red-600'}`}>
                  {percentageShift !== null ? `${percentageShift > 0 ? '+' : ''}${percentageShift}%` : '-'}
                </p>
              </div>
            </div>

            {assessment.post_assessment_score !== null && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">Pass Mark: {assessment.pass_mark}%</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${assessment.post_assessment_score >= assessment.pass_mark ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {assessment.post_assessment_score >= assessment.pass_mark ? '✓ PASSED' : '✗ FAILED - Re-Test Required'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Commentary */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">Commentary / Notes</label>
          <textarea
            value={assessment.commentary}
            onChange={(e) => setAssessment({ ...assessment, commentary: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
            placeholder="Add any additional notes or observations about the assessment results..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
