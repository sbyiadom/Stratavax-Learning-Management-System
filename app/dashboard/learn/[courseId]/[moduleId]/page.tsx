'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import LessonContent from '@/components/learning/LessonContent'
import CourseSidebar from '@/components/learning/CourseSidebar'
import ProgressTracker from '@/components/learning/ProgressTracker'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

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
  instructor_id?: string
  duration: string | null
  level: string | null
  price: number
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  instructor_details?: Profile
  modules?: Module[]
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

export default function LearningPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchCourseData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error('No user found')
          setLoading(false)
          return
        }

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            instructor_details:profiles!instructor_id(*),
            modules(
              *,
              lessons(*)
            )
          `)
          .eq('id', courseId)
          .single()

        if (courseError) throw courseError

        if (!isMounted) return

        setCourse(courseData)
        setModules(courseData?.modules || [])

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', user.id)

        if (progressError) throw progressError

        const progressMap: Record<string, UserProgress> = {}
        progressData?.forEach((p: UserProgress) => {
          progressMap[p.lesson_id] = p
        })
        setUserProgress(progressMap)

        if (moduleId && courseData?.modules) {
          const targetModule = courseData.modules.find((m: Module) => m.id === moduleId)
          if (targetModule?.lessons?.[0]) {
            setCurrentLesson(targetModule.lessons[0])
            return
          }
        }
        
        if (courseData?.modules?.[0]?.lessons?.[0]) {
          setCurrentLesson(courseData.modules[0].lessons[0])
        }
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (courseId) {
      fetchCourseData()
    }

    return () => {
      isMounted = false
    }
  }, [courseId, moduleId, supabase])

  const markLessonComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !currentLesson) return

      const now = new Date().toISOString()
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          module_id: currentLesson.module_id,
          course_id: courseId,
          is_completed: true,
          completed_at: now,
          last_accessed_at: now,
          updated_at: now
        }, {
          onConflict: 'user_id,lesson_id'
        })

      if (error) throw error

      const updatedProgress = {
        ...userProgress,
        [currentLesson.id]: {
          ...userProgress[currentLesson.id],
          is_completed: true,
          completed_at: now,
          last_accessed_at: now,
          updated_at: now
        } as UserProgress
      }
      setUserProgress(updatedProgress)

      await updateCourseProgress(updatedProgress)
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  const updateCourseProgress = async (progressMap: Record<string, UserProgress>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const totalLessons = modules.reduce((acc: number, module: Module) => 
        acc + (module.lessons?.length || 0), 0)
      
      const completedLessons = Object.values(progressMap).filter(
        (p: UserProgress) => p.is_completed
      ).length

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

      const { error } = await supabase
        .from('enrollments')
        .update({
          progress_percentage: progressPercentage,
          status: progressPercentage === 100 ? 'completed' : 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const navigateToLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    trackLessonAccess(lesson.id)
  }

  const trackLessonAccess = async (lessonId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const now = new Date().toISOString()
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          module_id: currentLesson?.module_id,
          course_id: courseId,
          last_accessed_at: now,
          updated_at: now
        }, {
          onConflict: 'user_id,lesson_id'
        })
    } catch (error) {
      console.error('Error tracking lesson access:', error)
    }
  }

  const navigatePrevious = () => {
    const allLessons = modules.flatMap(m => m.lessons || [])
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id)
    if (currentIndex > 0) {
      navigateToLesson(allLessons[currentIndex - 1])
    }
  }

  const navigateNext = () => {
    const allLessons = modules.flatMap(m => m.lessons || [])
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id)
    if (currentIndex < allLessons.length - 1) {
      navigateToLesson(allLessons[currentIndex + 1])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course content...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
        </div>
      </div>
    )
  }

  const totalLessons = modules.reduce((acc: number, m: Module) => 
    acc + (m.lessons?.length || 0), 0)
  const completedLessons = Object.values(userProgress).filter(
    (p: UserProgress) => p.is_completed
  ).length

  return (
    <div className="flex h-screen bg-gray-50">
      <CourseSidebar
        course={course}
        modules={modules}
        userProgress={userProgress}
        currentLesson={currentLesson}
        onLessonSelect={navigateToLesson}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course?.title}</h1>
              <p className="text-sm text-gray-600">
                {currentLesson && (
                  <>Module {modules.findIndex(m => m.id === currentLesson?.module_id) + 1} • 
                  Lesson {modules.flatMap(m => m.lessons || []).findIndex(l => l.id === currentLesson?.id) + 1} of {totalLessons}</>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <ProgressTracker
                totalLessons={totalLessons}
                completedLessons={completedLessons}
              />
              
              <Button
                onClick={markLessonComplete}
                disabled={userProgress[currentLesson?.id || '']?.is_completed}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {userProgress[currentLesson?.id || '']?.is_completed ? 'Completed' : 'Mark Complete'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {currentLesson && (
            <LessonContent
              lesson={currentLesson}
              courseId={courseId}
            />
          )}
        </div>

        <div className="border-t bg-white px-6 py-4 flex justify-between">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={navigatePrevious}
            disabled={!currentLesson || modules.flatMap(m => m.lessons || []).findIndex(l => l.id === currentLesson?.id) === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous Lesson
          </Button>
          
          <Button 
            className="flex items-center gap-2"
            onClick={navigateNext}
            disabled={!currentLesson || modules.flatMap(m => m.lessons || []).findIndex(l => l.id === currentLesson?.id) === totalLessons - 1}
          >
            Next Lesson
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
