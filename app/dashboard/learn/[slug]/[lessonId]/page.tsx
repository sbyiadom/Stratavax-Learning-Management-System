import { createServerClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  FileText,
  HelpCircle,
  Award,
  Download,
  Maximize2,
  Clock
} from 'lucide-react'
import MarkCompleteButton from '@/components/dashboard/MarkCompleteButton'
import LessonContent from '@/components/dashboard/LessonContent'

// Lesson type icons
const lessonIcons = {
  video: PlayCircle,
  reading: FileText,
  quiz: HelpCircle,
  project: Award,
}

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string }
}) {
  const supabase = await createServerClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null // Let middleware handle redirect
  }
  
  // Fetch course and lesson details
  const { data: course } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      modules(
        id,
        title,
        module_order,
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
    .single()

  if (!course) {
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

  // Find current lesson and its position
  let currentLesson = null
  let currentModule = null
  let prevLesson = null
  let nextLesson = null
  let lessonIndex = -1
  let moduleIndex = -1

  for (let m = 0; m < course.modules.length; m++) {
    const module = course.modules[m]
    for (let l = 0; l < module.lessons.length; l++) {
      const lesson = module.lessons[l]
      
      if (lesson.id === params.lessonId) {
        currentLesson = lesson
        currentModule = module
        moduleIndex = m
        lessonIndex = l
        
        // Get previous lesson
        if (l > 0) {
          prevLesson = module.lessons[l - 1]
        } else if (m > 0 && course.modules[m - 1].lessons.length > 0) {
          const prevModule = course.modules[m - 1]
          prevLesson = prevModule.lessons[prevModule.lessons.length - 1]
        }
        
        // Get next lesson
        if (l < module.lessons.length - 1) {
          nextLesson = module.lessons[l + 1]
        } else if (m < course.modules.length - 1 && course.modules[m + 1].lessons.length > 0) {
          nextLesson = course.modules[m + 1].lessons[0]
        }
        
        break
      }
    }
    if (currentLesson) break
  }

  if (!currentLesson) {
    notFound()
  }

  // Check if lesson is already completed
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', user.id)
    .eq('lesson_id', params.lessonId)
    .single()

  const isCompleted = progress?.completed || false

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/learn/${params.slug}`}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{currentLesson.title}</h1>
                <p className="text-xs text-gray-500">
                  {course.title} • Module {moduleIndex + 1}: {currentModule?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={16} />
                {currentLesson.duration_minutes} min
              </span>
              {prevLesson && (
                <Link
                  href={`/dashboard/learn/${params.slug}/${prevLesson.id}`}
                  className="text-gray-600 hover:text-gray-900"
                  title="Previous Lesson"
                >
                  <ChevronLeft size={20} />
                </Link>
              )}
              {nextLesson && (
                <Link
                  href={`/dashboard/learn/${params.slug}/${nextLesson.id}`}
                  className="text-gray-600 hover:text-gray-900"
                  title="Next Lesson"
                >
                  <ChevronRight size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Content */}
        <LessonContent 
          lesson={currentLesson} 
          contentType={currentLesson.content_type}
        />

        {/* Resources Section */}
        {currentLesson.resources && currentLesson.resources.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Download size={18} />
              Lesson Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentLesson.resources.map((resource: any, idx: number) => (
                <a
                  key={idx}
                  href={resource.url}
                  download
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{resource.name}</p>
                      <p className="text-xs text-gray-500">{resource.size}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Navigation and Complete Button */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {prevLesson && (
              <Link
                href={`/dashboard/learn/${params.slug}/${prevLesson.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft size={18} />
                Previous Lesson
              </Link>
            )}
          </div>
          
          <MarkCompleteButton
            lessonId={params.lessonId}
            courseSlug={params.slug}
            isCompleted={isCompleted}
            nextLessonId={nextLesson?.id}
          />

          <div>
            {nextLesson && (
              <Link
                href={`/dashboard/learn/${params.slug}/${nextLesson.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                Next Lesson
                <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">
              You've completed this lesson! {nextLesson ? 'Continue to the next lesson.' : 'Congratulations on finishing the course!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
