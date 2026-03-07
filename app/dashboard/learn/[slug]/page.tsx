import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  CheckCircle, 
  ChevronLeft,
  PlayCircle,
  FileText,
  HelpCircle,
  Award,
  Users,
  Clock,
  MessageSquare
} from 'lucide-react'

// Define types
type Lesson = {
  id: string
  title: string
  content_type: 'video' | 'reading' | 'quiz' | 'project'
  content?: any
  duration_minutes: number
  lesson_order: number
  resources?: any[]
}

type Module = {
  id: string
  title: string
  description: string
  module_order: number
  estimated_minutes: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  duration_hours: number
  modules: Module[]
  enrollments?: { count: number }[]
}

// Lesson type icons
const lessonIcons: Record<string, any> = {
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
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // Let middleware handle redirect
  }
  
  // Fetch course with modules, lessons, and enrollment count
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      category,
      difficulty_level,
      duration_hours,
      enrollments(count),
      modules(
        id,
        title,
        description,
        module_order,
        estimated_minutes,
        lessons(
          id,
          title,
          content_type,
          content,
          duration_minutes,
          lesson_order,
          resources
        )
      )
    `)
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (error || !course) {
    notFound()
  }

  const typedCourse = course as unknown as Course

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', typedCourse.id)
    .single()

  if (!enrollment) {
    redirect(`/dashboard/courses/${params.slug}`)
  }

  // Get lesson progress
  const allLessonIds = typedCourse.modules?.flatMap((m: Module) => 
    m.lessons?.map((l: Lesson) => l.id) || []
  ) || []
  
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', user.id)
    .in('lesson_id', allLessonIds)

  const completedLessons = new Set(
    progress?.filter(p => p.completed).map(p => p.lesson_id) || []
  )

  // Calculate progress
  const totalLessons = allLessonIds.length
  const completedCount = completedLessons.size
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedCount / totalLessons) * 100) 
    : 0

  // Group lessons by module
  const modulesWithProgress = typedCourse.modules?.map((module: Module) => ({
    ...module,
    completedCount: module.lessons?.filter((l: Lesson) => completedLessons.has(l.id)).length || 0,
    totalCount: module.lessons?.length || 0
  }))

  // Find first incomplete lesson
  let firstIncompleteLesson = null
  for (const module of typedCourse.modules || []) {
    for (const lesson of module.lessons || []) {
      if (!completedLessons.has(lesson.id)) {
        firstIncompleteLesson = lesson.id
        break
      }
    }
    if (firstIncompleteLesson) break
  }

  // Get enrollment count safely
  const enrollmentCount = typedCourse.enrollments?.[0]?.count || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/dashboard/courses/${params.slug}`}
              className="text-white/80 hover:text-white"
            >
              <ChevronLeft size={20} />
            </Link>
            <span className="text-sm text-white/80">Back to Course</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {typedCourse.category}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm capitalize">
                  {typedCourse.difficulty_level}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{typedCourse.title}</h1>
              <p className="text-blue-100 mb-6 max-w-3xl">{typedCourse.description}</p>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{typedCourse.duration_hours} hours</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{enrollmentCount} students</span>
                </div>
              </div>
            </div>
            
            {/* Progress Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[300px]">
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-100">Your Progress</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-blue-200">
                  <span>{completedCount} of {totalLessons} completed</span>
                  <span>{totalLessons - completedCount} remaining</span>
                </div>
              </div>
              
              {firstIncompleteLesson ? (
                <Link
                  href={`/dashboard/learn/${params.slug}/${firstIncompleteLesson}`}
                  className="w-full py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 mb-3 flex items-center justify-center transition"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
                </Link>
              ) : (
                <div className="text-center py-2">
                  <CheckCircle className="h-8 w-8 text-white mx-auto mb-2" />
                  <p className="text-sm text-white">Course Completed!</p>
                </div>
              )}
              
              {enrollment?.last_accessed_at && (
                <div className="text-center text-sm text-blue-200">
                  Last accessed: {new Date(enrollment.last_accessed_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Modules and Lessons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Modules */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Course Content</h2>
              <div className="space-y-4">
                {modulesWithProgress?.map((module: any, moduleIdx: number) => (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          Module {moduleIdx + 1}: {module.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {module.completedCount}/{module.totalCount} • {module.estimated_minutes} min
                        </span>
                      </div>
                      {module.description && (
                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                      )}
                    </div>

                    <div className="divide-y">
                      {module.lessons?.map((lesson: Lesson) => {
                        const Icon = lessonIcons[lesson.content_type] || FileText
                        const isCompleted = completedLessons.has(lesson.id)
                        
                        return (
                          <Link
                            key={lesson.id}
                            href={`/dashboard/learn/${params.slug}/${lesson.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={16} className={isCompleted ? 'text-green-500' : 'text-gray-400'} />
                              <div>
                                <span className="text-sm text-gray-700">{lesson.title}</span>
                                <span className="text-xs text-gray-400 ml-2 capitalize">
                                  {lesson.content_type}
                                </span>
                              </div>
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
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Your Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lessons completed</span>
                  <span className="font-medium">{completedCount}/{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Modules completed</span>
                  <span className="font-medium">
                    {modulesWithProgress?.filter((m: any) => m.completedCount === m.totalCount).length || 0}/{modulesWithProgress?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time spent</span>
                  <span className="font-medium">
                    {Math.round(completedCount * 12)} min
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/courses/${params.slug}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <BookOpen size={16} />
                  Course overview
                </Link>
                <Link
                  href={`/dashboard/notes/${params.slug}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <FileText size={16} />
                  My notes
                </Link>
              </div>
            </div>

            {/* Certificate Card */}
            {progressPercentage === 100 && (
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                <Award className="h-12 w-12 mb-4" />
                <h3 className="font-bold text-lg mb-2">Congratulations!</h3>
                <p className="text-sm text-yellow-100 mb-4">
                  You've completed all lessons. Claim your certificate now.
                </p>
                <Link
                  href={`/dashboard/certificates/${params.slug}`}
                  className="block w-full text-center py-2 bg-white text-yellow-600 rounded-lg hover:bg-yellow-50 font-medium transition"
                >
                  Get Certificate
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
