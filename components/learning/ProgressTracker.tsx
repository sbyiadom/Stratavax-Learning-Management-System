'use client'

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'

interface ProgressTrackerProps {
  totalLessons: number
  completedLessons: number
}

export default function ProgressTracker({ totalLessons, completedLessons }: ProgressTrackerProps) {
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{completedLessons}</span>
        </div>
        <span className="text-sm text-gray-500">/</span>
        <div className="flex items-center gap-1">
          <Circle className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">{totalLessons}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Progress value={progressPercentage} className="w-24 h-2" />
        <span className="text-sm font-medium min-w-[3rem]">{progressPercentage}%</span>
      </div>
    </div>
  )
}
