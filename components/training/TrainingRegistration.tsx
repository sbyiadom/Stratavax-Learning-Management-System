'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Calendar, AlertCircle, CheckCircle, BookOpen, Plus, X, Clock } from 'lucide-react'

interface TrainingRegistrationProps {
  userId: string
  onRegistered?: () => void
}

interface CourseOption {
  id: string
  title: string
  category: string
  duration_hours: number
}

export default function TrainingRegistration({ userId, onRegistered }: TrainingRegistrationProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [formData, setFormData] = useState({
    course_id: '',
    course_title: '',
    course_category: '',
    course_duration: '',
    training_date: '',
    priority: 'normal',
    manager_notes: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    if (showForm) {
      fetchCourses()
    }
  }, [showForm])

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, category, duration_hours')
      .eq('is_published', true)
      .order('title')
    
    if (data) {
      setCourses(data)
    }
  }

  const handleCourseSelect = (courseId: string) => {
    const selected = courses.find(c => c.id === courseId)
    if (selected) {
      setFormData({
        ...formData,
        course_id: selected.id,
        course_title: selected.title,
        course_category: selected.category || '',
        course_duration: selected.duration_hours?.toString() || ''
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.course_title.trim()) {
        throw new Error('Course title is required')
      }

      const { error } = await supabase
        .from('training_registrations')
        .insert({
          user_id: userId,
          course_id: formData.course_id || null,
          course_title: formData.course_title,
          course_category: formData.course_category,
          course_duration: parseInt(formData.course_duration) || null,
          training_date: formData.training_date ? new Date(formData.training_date).toISOString() : null,
          priority: formData.priority,
          manager_notes: formData.manager_notes,
          status: 'requested',
          requested_date: new Date().toISOString()
        })

      if (error) throw error

      setSuccess('Training registration submitted successfully!')
      setShowForm(false)
      setFormData({
        course_id: '',
        course_title: '',
        course_category: '',
        course_duration: '',
        training_date: '',
        priority: 'normal',
        manager_notes: ''
      })
      onRegistered?.()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to submit registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium"
      >
        <Plus className="w-4 h-4" />
        Request New Training
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Request Training</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course (Optional)</label>
          <select
            value={formData.course_id}
            onChange={(e) => handleCourseSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select from existing courses --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.duration_hours} hours)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={formData.course_title}
              onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
              placeholder="Enter course title"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.course_category}
              onChange={(e) => setFormData({ ...formData, course_category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Technical, Soft Skills"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={formData.course_duration}
                onChange={(e) => setFormData({ ...formData, course_duration: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Duration in hours"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Training Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={formData.training_date}
                onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Comments</label>
          <textarea
            value={formData.manager_notes}
            onChange={(e) => setFormData({ ...formData, manager_notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional information about this training request..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  )
}
