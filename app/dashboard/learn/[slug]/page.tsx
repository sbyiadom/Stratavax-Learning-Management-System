import { createServerClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  Award,
  BarChart
} from 'lucide-react'
import ContinueLearningButton from '@/components/dashboard/ContinueLearningButton'

// Lesson type icons
const lessonIcons = {
  video: PlayCircle,
  reading: FileText,
  quiz: HelpCircle,
  project: Award,
}

export default async function LearnPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createServerClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // Let middleware handle redirect
  }
  
  // Fetch course with modules and lessons
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      modules(
        id,
        title,
        module_order,
        estimated_minutes,
        lessons(
          id,
          title,
          content_type,
          duration_minutes,
          lesson_order
        )
      )
    `)
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (error || !course) {
    notFound()
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) {
    redirect(`/dashboard/courses/${params.slug}`)
  }

  // Get lesson progress
  const allLessonIds = course.modules?.flatMap(m => m.lessons?.map(l => l.id) || []) || []
  
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', user.id)
    .in('lesson_id', allLessonIds)

  const completedLessons = new Set(
    progress?.filter(p => p.completed).map(p => p.lesson_id) || []
  )

  // Find first incomplete lesson to suggest starting point
  let firstIncompleteLesson = null
  for (const module of course.modules || []) {
    for (const lesson of module.lessons || []) {
      if (!completedLessons.has(lesson.id)) {
        firstIncompleteLesson = {
          moduleId: module.id,
          lessonId: lesson.id,
        }
        break
      }
    }
    if (firstIncompleteLesson) break
  }

  // Calculate progress
  const totalLessons = allLessonIds.length
  const completedCount = completedLessons.size
  const progressPercentage = Math.round((completedCount / totalLessons) * 100) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/courses/${params.slug}`}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-500">Continue your learning journey</p>
              </div>
            </div>
            <Link
              href={`/dashboard/courses/${params.slug}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Course Overview
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Your Progress</h2>
                <span className="text-sm text-gray-600">{progressPercentage}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{completedCount} of {totalLessons} lessons completed</span>
                <span>{totalLessons - completedCount} remaining</span>
              </div>
            </div>

            {/* Start/Continue Button */}
            {firstIncompleteLesson ? (
              <Link
                href={`/dashboard/learn/${params.slug}/${firstIncompleteLesson.lessonId}`}
                className="block w-full bg-green-600 text-white rounded-lg p-4 text-center font-medium hover:bg-green-700 transition mb-6"
              >
                {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
              </Link>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-700 mb-1">Congratulations!</h3>
                <p className="text-sm text-green-600 mb-4">You've completed all lessons in this course.</p>
                <Link
                  href={`/dashboard/certificates/${params.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Award size={18} />
                  View Certificate
                </Link>
              </div>
            )}

            {/* Course Modules */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold mb-4">Course Content</h2>
              <div className="space-y-4">
                {course.modules?.map((module, moduleIdx) => {
                  const moduleLessons = module.lessons || []
                  const completedInModule = moduleLessons.filter(l => completedLessons.has(l.id)).length
                  
                  return (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">
                            Module {moduleIdx + 1}: {module.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {completedInModule}/{moduleLessons.length} • {module.estimated_minutes} min
                          </span>
                        </div>
                      </div>

                      <div className="divide-y">
                        {moduleLessons.map((lesson) => {
                          const Icon = lessonIcons[lesson.content_type as keyof typeof lessonIcons] || FileText
                          const isCompleted = completedLessons.has(lesson.id)
                          
                          return (
                            <Link
                              key={lesson.id}
                              href={`/dashboard/learn/${params.slug}/${lesson.id}`}
                              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center gap-3">
                                <Icon size={16} className={isCompleted ? 'text-green-500' : 'text-gray-400'} />
                                <span className="text-sm text-gray-700">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{lesson.duration_minutes} min</span>
                                {isCompleted ? (
                                  <CheckCircle size={16} className="text-green-500" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Your Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Lessons completed</span>
                  <span className="font-medium">{completedCount}/{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Modules completed</span>
                  <span className="font-medium">
                    {course.modules?.filter(m => 
                      m.lessons?.every(l => completedLessons.has(l.id))
                    ).length || 0}/{course.modules?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time spent</span>
                  <span className="font-medium">
                    {Math.round(completedCount * 12)} min
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/courses/${params.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <BookOpen size={16} />
                    Course overview
                  </Link>
                  <Link
                    href={`/dashboard/discussions/${params.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <HelpCircle size={16} />
                    Discussion forum
                  </Link>
                  <Link
                    href={`/dashboard/notes/${params.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <FileText size={16} />
                    My notes
                  </Link>
                </div>
              </div>

              {progressPercentage === 100 && (
                <div className="mt-6 pt-6 border-t">
                  <Link
                    href={`/dashboard/certificates/${params.slug}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  >
                    <Award size={18} />
                    Get Certificate
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
