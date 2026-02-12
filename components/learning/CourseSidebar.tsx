'use client'

import { CheckCircle2, Circle, Lock, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Module, Lesson, UserProgress } from '@/lib/supabase'

interface CourseSidebarProps {
  course: any
  modules: Module[]
  userProgress: Record<string, UserProgress>
  currentLesson: Lesson | null
  onLessonSelect: (lesson: Lesson) => void
}

export default function CourseSidebar({
  course,
  modules,
  userProgress,
  currentLesson,
  onLessonSelect
}: CourseSidebarProps) {
  return (
    <div className="w-80 bg-white border-r flex flex-col h-screen">
      <div className="p-6 border-b">
        <h2 className="font-semibold text-lg">Course Content</h2>
        <p className="text-sm text-gray-500 mt-1">{modules.length} modules</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="border-b last:border-b-0">
            <div className="p-4 bg-gray-50">
              <h3 className="font-medium">
                Module {moduleIndex + 1}: {module.title}
              </h3>
              {module.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {module.description}
                </p>
              )}
            </div>
            
            <div className="divide-y">
              {module.lessons?.map((lesson) => {
                const isCompleted = userProgress[lesson.id]?.is_completed
                const isCurrent = currentLesson?.id === lesson.id
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onLessonSelect(lesson)}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left",
                      isCurrent && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : isCurrent ? (
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm",
                        isCompleted && "line-through text-gray-500",
                        isCurrent && "font-medium text-blue-700"
                      )}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {lesson.duration ? `${lesson.duration} min` : 'Lesson'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
