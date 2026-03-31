'use client'

import { BookOpen, CheckCircle, Clock, Award, TrendingUp, Zap } from 'lucide-react'

interface ProgressStatsProps {
  totalCourses: number
  completedCourses: number
  totalLessons: number
  completedLessons: number
  totalHours: number
  completedHours: number
  streakDays: number
}

export default function ProgressStats({
  totalCourses,
  completedCourses,
  totalLessons,
  completedLessons,
  totalHours,
  completedHours,
  streakDays
}: ProgressStatsProps) {
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Learning Progress
        </h2>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{streakDays} day streak</span>
        </div>
      </div>

      {/* Overall Progress Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - overallProgress / 100)}`}
              className="text-blue-600 transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{overallProgress}%</span>
            <span className="text-xs text-gray-500">Complete</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Courses</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{completedCourses}/{totalCourses}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-600">Lessons</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{completedLessons}/{totalLessons}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-gray-600">Hours</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{completedHours}/{totalHours}</p>
          <p className="text-xs text-gray-500">Learned</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Certificates</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{completedCourses}</p>
          <p className="text-xs text-gray-500">Earned</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Completion</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
