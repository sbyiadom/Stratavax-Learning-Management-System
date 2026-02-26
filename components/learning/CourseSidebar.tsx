'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle2, Circle, Lock, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Local type definitions
interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
}

interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  duration: string | null
  level: string | null
  price: number
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  instructor_details?: Profile
}

interface Lesson {
  id: string
  course_id: string
  module_id: string | null
  title: string
  content: string | null
  video_url: string | null
  duration: string | null
  order_index: number
  created_at: string
  updated_at: string
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
  lessons?: Lesson[]
}

interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  module_id: string | null
  course_id: string
  is_completed: boolean
  completed_at: string | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

interface CourseSidebarProps {
  course: Course
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
  const pathname = usePathname()

  const getLessonIcon = (lessonId: string) => {
    const progress = userProgress[lessonId]
    if (progress?.is_completed) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
    if (progress?.last_accessed_at) {
      return <PlayCircle className="w-4 h-4 text-blue-500" />
    }
    return <Circle className="w-4 h-4 text-gray-300" />
  }

  const isLessonLocked = (lessonIndex: number, moduleIndex: number) => {
    // Simple logic: first lesson is always unlocked
    if (moduleIndex === 0 && lessonIndex === 0) return false
    
    // Check if previous lesson is completed
    const allLessons = modules.flatMap(m => m.lessons || [])
    const currentLessonIndex = allLessons.findIndex(l => l.id === currentLesson?.id)
    
    // For now, just return false to keep all lessons accessible
    return false
  }

  return (
    <div className="w-80 bg-white border-r h-screen overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">{course.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {course.level}
          </span>
          <span className="text-xs text-gray-500">{course.duration}</span>
        </div>
      </div>

      <div className="p-4">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="mb-6">
            <h3 className="font-medium text-sm mb-2">{module.title}</h3>
            {module.description && (
              <p className="text-xs text-gray-500 mb-2">{module.description}</p>
            )}
            
            <div className="space-y-1">
              {module.lessons?.map((lesson, lessonIndex) => {
                const isLocked = isLessonLocked(lessonIndex, moduleIndex)
                const isActive = currentLesson?.id === lesson.id
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && onLessonSelect(lesson)}
                    disabled={isLocked}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors",
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50',
                      isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-gray-400" />
                      ) : (
                        getLessonIcon(lesson.id)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        isActive ? 'font-medium text-blue-700' : 'text-gray-700'
                      )}>
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-gray-400">{lesson.duration}</p>
                      )}
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
