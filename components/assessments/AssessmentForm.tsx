'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Save, AlertCircle, CheckCircle, Printer, Calculator, ArrowUp, ArrowDown, X } from 'lucide-react'

interface AssessmentFormProps {
  registrationId: string
  courseTitle: string
  userId: string
  onSaved?: () => void
  onCancel?: () => void
}

export default function AssessmentForm({ 
  registrationId, 
  courseTitle, 
  userId, 
  onSaved,
  onCancel 
}: AssessmentFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [existingAssessment, setExistingAssessment] = useState<any>(null)
  const [formData, setFormData] = useState({
    staff_number: '',
    employee_name: '',
    job_title: '',
    plant: '',
    department: '',
    pass_mark: 70,
    pre_assessment_score: null as number | null,
    post_assessment_score: null as number | null,
    possible_score: 100,
    commentary: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    loadExistingAssessment()
    loadUserProfile()
  }, [registrationId])

  const loadExistingAssessment = async () => {
    const { data } = await supabase
      .from('knowledge_assessments')
      .select('*')
      .eq('registration_id', registrationId)
      .maybeSingle()
    
    if (data) {
      setExistingAssessment(data)
      setFormData({
        staff_number: data.staff_number || '',
        employee_name: data.employee_name || '',
        job_title: data.job_title || '',
        plant: data.plant || '',
        department: data.department || '',
        pass_mark: data.pass_mark || 70,
        pre_assessment_score: data.pre_assessment_score,
        post_assessment_score: data.post_assessment_score,
        possible_score: data.possible_score || 100,
        commentary: data.commentary || ''
      })
    }
    setLoading(false)
  }

  const loadUserProfile = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()
    
    if (profile && !existingAssessment) {
      setFormData(prev => ({
        ...prev,
        employee_name: `${profile.first_name} ${profile.last_name}`.trim()
      }))
    }
  }

  const difference = formData.pre_assessment_score !== null && formData.post_assessment_score !== null
    ? formData.post_assessment_score - formData.pre_assessment_score
    : null
  
  const percentageShift = difference !== null && formData.possible_score > 0
    ? ((difference / formData.possible_score) * 100).toFixed(2)
    : null
  
  const hasImprovement = difference !== null && difference > 0
  const passed = formData.post_assessment_score !== null && formData.post_assessment_score >= formData.pass_mark

  const handleSave = async () => {
    if (!formData.pre_assessment_score || !formData.post_assessment_score) {
      setError('Please enter both pre and post assessment scores')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const assessmentData = {
        registration_id: registrationId,
        user_id: userId,
        course_title: courseTitle,
        staff_number: formData.staff_number,
        employee_name: formData.employee_name,
        job_title: formData.job_title,
        plant: formData.plant,
        department: formData.department,
        pass_mark: formData.pass_mark,
        pre_assessment_score: formData.pre_assessment_score,
        post_assessment_score: formData.post_assessment_score,
        possible_score: formData.possible_score,
        pre_assessment_date: new Date().toISOString(),
        post_assessment_date: new Date().toISOString(),
        commentary: formData.commentary
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
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Knowledge Assessment Results</h2>
          <p className="text-blue-100 text-xs mt-0.5">{courseTitle}</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Employee Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Staff Number</label>
            <input
              type="text"
              value={formData.staff_number}
              onChange={(e) => setFormData({ ...formData, staff_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., STAFF001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Employee Name</label>
            <input
              type="text"
              value={formData.employee_name}
              onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Engineer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Plant / Site</label>
            <input
              type="text"
              value={formData.plant}
              onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Akwadum"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Engineering"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pass Mark (%)</label>
            <input
              type="number"
              value={formData.pass_mark}
              onChange={(e) => setFormData({ ...formData, pass_mark: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Assessment Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pre-Assessment Score</label>
            <input
              type="number"
              value={formData.pre_assessment_score || ''}
              onChange={(e) => setFormData({ ...formData, pre_assessment_score: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max={formData.possible_score}
              placeholder="Score before training"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Post-Assessment Score</label>
            <input
              type="number"
              value={formData.post_assessment_score || ''}
              onChange={(e) => setFormData({ ...formData, post_assessment_score: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
              max={formData.possible_score}
              placeholder="Score after training"
            />
          </div>
        </div>

        {/* Results Analysis - Auto-calculated */}
        {(formData.pre_assessment_score !== null || formData.post_assessment_score !== null) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4 text-blue-600" />
              Knowledge Improvement Analysis
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Pre-Assessment</p>
                <p className="text-xl font-bold text-gray-900">{formData.pre_assessment_score !== null ? `${formData.pre_assessment_score}%` : '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Post-Assessment</p>
                <p className="text-xl font-bold text-gray-900">{formData.post_assessment_score !== null ? `${formData.post_assessment_score}%` : '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Difference</p>
                <div className="flex items-center justify-center gap-0.5">
                  {difference !== null && (
                    <>
                      {hasImprovement ? <ArrowUp className="w-3 h-3 text-green-600" /> : <ArrowDown className="w-3 h-3 text-red-600" />}
                      <p className={`text-xl font-bold ${hasImprovement ? 'text-green-600' : 'text-red-600'}`}>
                        {difference > 0 ? '+' : ''}{difference}
                      </p>
                    </>
                  )}
                  {difference === null && <p className="text-xl font-bold text-gray-400">-</p>}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">% Shift</p>
                <p className={`text-xl font-bold ${hasImprovement ? 'text-green-600' : 'text-red-600'}`}>
                  {percentageShift !== null ? `${percentageShift > 0 ? '+' : ''}${percentageShift}%` : '-'}
                </p>
              </div>
            </div>

            {formData.post_assessment_score !== null && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Pass Mark: {formData.pass_mark}%</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {passed ? '✓ PASSED' : '✗ FAILED - Re-Test Required'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Commentary */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">Commentary / Notes</label>
          <textarea
            value={formData.commentary}
            onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
            placeholder="Add any additional notes or observations..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {success && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">{success}</p>
          </div>
        )}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
