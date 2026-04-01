'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Calendar, Clock, AlertCircle, CheckCircle, FileText, ChevronRight, BookOpen, Award } from 'lucide-react'
import Link from 'next/link'

interface TrainingRegistration {
  id: string
  course_title: string
  course_category: string
  course_duration: number
  requested_date: string
  training_date: string
  status: string
  priority: string
  manager_approval: boolean
  manager_notes: string
}

interface KnowledgeAssessment {
  id: string
  registration_id: string
  pre_assessment_score: number | null
  post_assessment_score: number | null
  pass_mark: number
}

export default function TrainingDashboard({ userId }: { userId: string }) {
  const [registrations, setRegistrations] = useState<TrainingRegistration[]>([])
  const [assessments, setAssessments] = useState<Map<string, KnowledgeAssessment>>(new Map())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    const { data: regData } = await supabase
      .from('training_registrations')
      .select('*')
      .eq('user_id', userId)
      .order('requested_date', { ascending: false })

    if (regData) {
      setRegistrations(regData)
      
      const assessmentMap = new Map()
      for (const reg of regData) {
        const { data: assessData } = await supabase
          .from('knowledge_assessments')
          .select('*')
          .eq('registration_id', reg.id)
          .maybeSingle()
        
        if (assessData) {
          assessmentMap.set(reg.id, assessData)
        }
      }
      setAssessments(assessmentMap)
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-amber-100 text-amber-700'
      case 'approved': return 'bg-blue-100 text-blue-700'
      case 'in_progress': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700'
      case 'normal': return 'border-blue-200 bg-blue-50 text-blue-700'
      case 'low': return 'border-gray-200 bg-gray-50 text-gray-700'
      default: return 'border-gray-200 bg-gray-50 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          My Training Requests
        </h3>
      </div>
      
      {registrations.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No training requests yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Request New Training" to get started</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {registrations.map((reg) => {
            const assessment = assessments.get(reg.id)
            const hasAssessment = assessment && (assessment.pre_assessment_score || assessment.post_assessment_score)
            const isCompleted = reg.status === 'completed'
            
            return (
              <div key={reg.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">{reg.course_title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(reg.status)}`}>
                        {reg.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(reg.priority)}`}>
                        {reg.priority}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Requested: {new Date(reg.requested_date).toLocaleDateString()}
                      </span>
                      {reg.training_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Training: {new Date(reg.training_date).toLocaleDateString()}
                        </span>
                      )}
                      {reg.course_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {reg.course_duration} hours
                        </span>
                      )}
                    </div>
                    {reg.manager_notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">Note: {reg.manager_notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAssessment ? (
                      <Link
                        href={`/dashboard/assessments/${reg.id}`}
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        View Assessment
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : isCompleted && (
                      <Link
                        href={`/dashboard/assessments/new?registration=${reg.id}&course=${encodeURIComponent(reg.course_title)}`}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Add Assessment
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
