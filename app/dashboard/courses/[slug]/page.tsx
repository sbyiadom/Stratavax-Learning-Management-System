import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  Award, 
  Users, 
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  Zap
} from 'lucide-react'
import EnrollButton from '@/components/dashboard/EnrollButton'

// Define types for better TypeScript support
type Lesson = {
  id: string
  title: string
  content_type: string
  duration_minutes: number
  lesson_order: number
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
  learning_objectives?: string[]
  prerequisites?: string[]
  modules?: Module[]
  enrollments?: any[]
}

// Difficulty level badges
const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
}

// Lesson type icons
const lessonIcons = {
  video: PlayCircle,
  reading: FileText,
  quiz: HelpCircle,
  project: Award,
}

export default async function CourseDetailPage({
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
  
  // Fetch course details with modules and lessons
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
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

  // Cast course to our type
  const typedCourse = course as unknown as Course

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', typedCourse.id)
    .single()

  // Get lesson progress if enrolled
  let completedLessons = new Set<string>()
  if (enrollment && typedCourse.modules) {
    // Get all lesson IDs first
    const allLessonIds = typedCourse.modules.flatMap((module: Module) => 
      module.lessons?.map((lesson: Lesson) => lesson.id) || []
    )
    
    if (allLessonIds.length > 0) {
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', allLessonIds)
        .eq('completed', true)

      completedLessons = new Set(progress?.map(p => p.lesson_id) || [])
    }
  }

  // Calculate total lessons and duration
  const totalLessons = typedCourse.modules?.reduce(
    (acc: number, module: Module) => acc + (module.lessons?.length || 0), 
    0
  ) || 0

  const completedCount = completedLessons.size
  const progress = enrollment ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/courses"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{typedCourse.title}</h1>
              <p className="text-sm text-gray-600">{typedCourse.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2">
            {/* Course Image */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl h-64 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-white text-8xl opacity-10">
                {typedCourse.category?.includes('Digital') && '💻'}
                {typedCourse.category?.includes('Entrepreneurship') && '🚀'}
                {typedCourse.category?.includes('Leadership') && '🌟'}
                {typedCourse.category?.includes('Engineering') && '⚙️'}
                {typedCourse.category?.includes('Financial') && '💰'}
                {typedCourse.category?.includes('Career') && '📈'}
                {typedCourse.category?.includes('Digital Economy') && '🔮'}
              </div>
              <div className="absolute bottom-6 left-6 text-white">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  difficultyColors[typedCourse.difficulty_level as keyof typeof difficultyColors]
                }`}>
                  {typedCourse.difficulty_level}
                </span>
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">About This Course</h2>
              <p className="text-gray-700 whitespace-pre-line">{typedCourse.description}</p>
            </div>

            {/* What You'll Learn */}
            {typedCourse.learning_objectives && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {typedCourse.learning_objectives.map((objective: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{objective}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Course Content</h2>
                <span className="text-sm text-gray-500">
                  {typedCourse.modules?.length || 0} modules • {totalLessons} lessons
                </span>
              </div>

              <div className="space-y-4">
                {typedCourse.modules?.map((module: Module, idx: number) => (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Module {idx + 1}: {module.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {module.lessons?.length || 0} lessons • {module.estimated_minutes} min
                      </span>
                    </div>

                    {module.lessons && module.lessons.length > 0 && (
                      <div className="divide-y">
                        {module.lessons.map((lesson: Lesson) => {
                          const Icon = lessonIcons[lesson.content_type as keyof typeof lessonIcons] || FileText
                          const isCompleted = completedLessons.has(lesson.id)
                          
                          return (
                            <div key={lesson.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <Icon size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-700">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{lesson.duration_minutes} min</span>
                                {isCompleted && (
                                  <CheckCircle size={16} className="text-green-500" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Course Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              {/* Course Stats */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600">{progress}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock size={16} />
                    Duration
                  </span>
                  <span className="font-medium">{typedCourse.duration_hours} hours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <BookOpen size={16} />
                    Lessons
                  </span>
                  <span className="font-medium">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users size={16} />
                    Enrolled
                  </span>
                  <span className="font-medium">{typedCourse.enrollments?.length || 0}</span>
                </div>
                {enrollment && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Zap size={16} />
                      Completed
                    </span>
                    <span className="font-medium">{completedCount}/{totalLessons}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {enrollment ? (
                <Link
                  href={`/dashboard/learn/${typedCourse.slug}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-3"
                >
                  <PlayCircle size={18} />
                  Continue Learning
                </Link>
              ) : (
                <EnrollButton courseId={typedCourse.id} courseSlug={typedCourse.slug} />
              )}

              {/* Prerequisites */}
              {typedCourse.prerequisites && typedCourse.prerequisites.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Prerequisites</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {typedCourse.prerequisites.map((prereq: string, idx: number) => (
                      <li key={idx}>• {prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Includes */}
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">This Course Includes</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Full lifetime access</li>
                  <li>• Certificate of completion</li>
                  <li>• Downloadable resources</li>
                  <li>• Mobile and TV access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
