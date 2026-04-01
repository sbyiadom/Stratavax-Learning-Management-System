'use client'

import Link from 'next/link'
import { Calendar, Clock, Users, Award, CheckCircle, FileText } from 'lucide-react'

interface TrainingRecord {
  id: string
  user_id: string
  personnel_number: string
  employee_position: string
  country: string
  site_location: string
  department: string
  line_manager: string
  course_name: string
  duration_minutes: number
  training_date: string
  evaluation_score: number
  profiles?: {
    first_name: string
    last_name: string
  }
}

interface TrainingRecordsListProps {
  records: TrainingRecord[]
  isSupervisor: boolean
  userId: string
}

export default function TrainingRecordsList({ records, isSupervisor, userId }: TrainingRecordsListProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No training records yet</h3>
        <p className="text-gray-500 text-sm">
          Complete the Training Registration & Evaluation form to add your records.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Recent Training Records
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {records.map((record) => {
          const employeeName = record.profiles 
            ? `${record.profiles.first_name} ${record.profiles.last_name}`.trim()
            : record.personnel_number || 'Unknown'
          
          return (
            <div key={record.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900">{record.course_name}</h4>
                    {record.evaluation_score && record.evaluation_score >= 70 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✓ Evaluated
                      </span>
                    ) : record.evaluation_score ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Needs Review
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {employeeName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.training_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {record.duration_minutes} min
                    </span>
                    {record.department && (
                      <span className="text-gray-400">{record.department}</span>
                    )}
                  </div>
                  
                  {record.evaluation_score && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">Evaluation Score:</div>
                      <div className="flex items-center gap-1">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${record.evaluation_score >= 70 ? 'bg-green-600' : 'bg-yellow-600'}`}
                            style={{ width: `${record.evaluation_score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{record.evaluation_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/assessments/new?training=${record.id}&course=${encodeURIComponent(record.course_name)}&employee=${encodeURIComponent(employeeName)}`}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Award className="w-3 h-3" />
                    Add Assessment
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
