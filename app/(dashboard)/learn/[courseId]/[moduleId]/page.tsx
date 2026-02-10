'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LessonContent from '@/components/learning/LessonContent'
import CourseSidebar from '@/components/learning/CourseSidebar'
import ProgressTracker from '@/components/learning/ProgressTracker'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

export default function LearningPage() {
  const params = useParams()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.courseId) {
      fetchCourseData()
    }
  }, [params.courseId])

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users(first_name, last_name, avatar_url),
          modules(*, lessons(*))
        `)
        .eq('id', params.courseId)
        .single()

      setCourse(courseData)
      setModules(courseData?.modules || [])

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('course_id', params.courseId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

      const progressMap = {}
      progressData?.forEach(p => {
        progressMap[p.lesson_id] = p
      })
      setUserProgress(progressMap)

      // Set initial lesson
      if (courseData?.modules?.[0]?.lessons?.[0]) {
        setCurrentLesson(courseData.modules[0].lessons[0])
      }
    } catch (error) {
      console.error('Error fetching course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markLessonComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user?.id,
          lesson_id: currentLesson.id,
          module_id: currentLesson.module_id,
          course_id: params.courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local state
      setUserProgress({
        ...userProgress,
        [currentLesson.id]: { is_completed: true }
      })

      // Update course progress
      await updateCourseProgress()
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  const updateCourseProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Calculate new progress
      const totalLessons = modules.reduce((acc, module) => 
        acc + (module.lessons?.length || 0), 0)
      
      const completedLessons = Object.values(userProgress).filter(
        (p: any) => p.is_completed
      ).length

      const progressPercentage = Math.round(
        (completedLessons / totalLessons) * 100
      )

      // Update enrollment
      await supabase
        .from('enrollments')
        .update({
          progress_percentage: progressPercentage,
          status: progressPercentage === 100 ? 'completed' : 'in_progress'
        })
        .eq('user_id', user?.id)
        .eq('course_id', params.courseId)
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const navigateToLesson = (lesson: any) => {
    setCurrentLesson(lesson)
    // Track lesson access
    trackLessonAccess(lesson.id)
  }

  const trackLessonAccess = async (lessonId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user?.id,
          lesson_id: lessonId,
          last_accessed_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking lesson access:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <CourseSidebar
        course={course}
        modules={modules}
        userProgress={userProgress}
        currentLesson={currentLesson}
        onLessonSelect={navigateToLesson}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course?.title}</h1>
              <p className="text-sm text-gray-600">
                Module {modules.findIndex(m => m.id === currentLesson?.module_id) + 1} • 
                Lesson {modules.flatMap(m => m.lessons).findIndex(l => l.id === currentLesson?.id) + 1}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <ProgressTracker
                totalLessons={modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}
                completedLessons={Object.values(userProgress).filter((p: any) => p.is_completed).length}
              />
              
              <Button
                onClick={markLessonComplete}
                disabled={userProgress[currentLesson?.id]?.is_completed}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Complete
              </Button>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentLesson && (
            <LessonContent
              lesson={currentLesson}
              courseId={params.courseId as string}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="border-t bg-white px-6 py-4 flex justify-between">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Previous Lesson
          </Button>
          
          <Button className="flex items-center gap-2">
            Next Lesson
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
