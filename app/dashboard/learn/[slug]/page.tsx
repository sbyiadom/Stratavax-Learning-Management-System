import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen, Clock, CheckCircle, Lock } from 'lucide-react'

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
  duration_hours: number | null
  enrollment_count: number | null
}

type Module = {
  id: string
  title: string
  description: string | null
  module_order: number
  estimated_minutes: number | null
  course_id: string
}

type Lesson = {
  id: string
  title: string
  module_id: string
  content_type: string | null
  duration_minutes: number | null
  lesson_order: number
  is_published: boolean | null
}

type ModuleWithLessons = Module & {
  lessons: Lesson[]
}

type LessonProgress = {
  lesson_id: string
  completed: boolean
  quiz_score: number | null
}

export default async function CoursePage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (courseError || !course) {
    console.error('Course error:', courseError)
    notFound()
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status, progress_percentage, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  const isEnrolled = !!enrollment

  // Get all modules for this course with their lessons
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      description,
      module_order,
      estimated_minutes,
      course_id,
      lessons:lessons(
        id,
        title,
        module_id,
        content_type,
        duration_minutes,
        lesson_order,
        is_published
      )
    `)
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('module_order', { ascending: true })

  if (modulesError) {
    console.error('Modules error:', modulesError)
  }

  // If user is enrolled, get their progress
  let lessonProgress: LessonProgress[] = []
  if (isEnrolled) {
    // Get all lesson IDs for this course
    const lessonIds = modules?.flatMap(m => 
      m.lessons?.map((l: Lesson) => l.id) || []
    ) || []

    if (lessonIds.length > 0) {
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, quiz_score')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)

      lessonProgress = progress || []
    }
  }

  // Calculate overall progress
  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const completedLessons = lessonProgress.filter(p => p.completed).length
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0

  // Handle enrollment
  async function enrollInCourse() {
    'use server'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: course.id,
        status: 'active',
        progress_percentage: 0
      })

    if (!error) {
      redirect(`/dashboard/learn/${params.slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <div className="md:w-64 h-48 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Course Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">
                {course.short_description || course.description}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                {course.difficulty_level && (
                  <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                    {course.difficulty_level}
                  </span>
                )}
                {course.duration_hours && (
                  <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Clock size={14} />
                    {course.duration_hours} hours
                  </span>
                )}
                <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <BookOpen size={14} />
                  {totalLessons} lessons
                </span>
                {course.enrollment_count && (
                  <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                    {course.enrollment_count} enrolled
                  </span>
                )}
              </div>

              {/* Enrollment/Progress */}
              {isEnrolled ? (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Your progress</span>
                    <span>{progressPercentage}% complete</span>
                  </div>
                  <div className="w-full bg-blue-300 bg-opacity-30 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  {enrollment.completed_at && (
                    <p className="text-sm mt-2 text-green-200">
                      ✓ Completed on {new Date(enrollment.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <form action={enrollInCourse}>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                  >
                    Enroll Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Description */}
        {course.description && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">About this course</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
          </div>
        )}

        {/* Modules and Lessons */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Course Content</h2>
          </div>

          <div className="divide-y">
            {modules?.map((module) => {
              const moduleLessons = module.lessons || []
              const completedInModule = moduleLessons.filter(
                l => lessonProgress.find(p => p.lesson_id === l.id)?.completed
              ).length

              return (
                <div key={module.id} className="p-6">
                  {/* Module Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                      Module {module.module_order}: {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{moduleLessons.length} lessons</span>
                      {module.estimated_minutes && (
                        <span>{module.estimated_minutes} min total</span>
                      )}
                      {isEnrolled && moduleLessons.length > 0 && (
                        <span className="text-green-600">
                          {completedInModule} of {moduleLessons.length} completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-2">
                    {moduleLessons.map((lesson) => {
                      const progress = lessonProgress.find(p => p.lesson_id === lesson.id)
                      const isCompleted = progress?.completed || false
                      const isLocked = !isEnrolled

                      return (
                        <Link
                          key={lesson.id}
                          href={isEnrolled 
                            ? `/dashboard/learn/${params.slug}/${lesson.id}`
                            : '#'
                          }
                          className={`flex items-center justify-between p-3 rounded-lg transition ${
                            isEnrolled 
                              ? 'hover:bg-gray-50 cursor-pointer' 
                              : 'cursor-not-allowed opacity-75'
                          }`}
                          onClick={(e) => !isEnrolled && e.preventDefault()}
                        >
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle size={18} className="text-green-600" />
                            ) : isLocked ? (
                              <Lock size={18} className="text-gray-400" />
                            ) : (
                              <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-300" />
                            )}
                            <div>
                              <span className="font-medium">
                                {lesson.lesson_order}. {lesson.title}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span>{lesson.content_type || 'video'}</span>
                                {lesson.duration_minutes && (
                                  <span>{lesson.duration_minutes} min</span>
                                )}
                                {progress?.quiz_score !== null && progress?.quiz_score !== undefined && (
                                  <span className={progress.quiz_score >= 70 ? 'text-green-600' : 'text-orange-600'}>
                                    Score: {progress.quiz_score}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isEnrolled && (
                            <span className="text-blue-600 text-sm">
                              {isCompleted ? 'Review' : 'Start'}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Enrollment CTA at bottom if not enrolled */}
        {!isEnrolled && (
          <div className="mt-8 text-center">
            <form action={enrollInCourse}>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Enroll in this course to start learning
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
