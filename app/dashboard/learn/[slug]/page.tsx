import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen, Clock, CheckCircle, Lock, Film, FileText, Code } from 'lucide-react'
import CourseImage from '@/components/shared/CourseImage'

// Approved course slugs from your PDF (the ones with correct videos)
const APPROVED_COURSE_SLUGS = [
  'computer-basics',
  'computer-skills-intermediate',
  'computer-networking-advanced',
  'excel-beginners',
  'excel-data-analysis',
  'excel-advanced',
  'cs50-intro',
  'python-programming',
  'software-engineering',
  'html-css',
  'javascript',
  'full-stack',
  'data-analysis-excel',
  'python-data-analysis',
  'machine-learning',
  'entrepreneurship-intro',
  'business-model-design',
  'business-plan-development',
  'personal-finance',
  'mechanical-engineering',
  'electrical-engineering',
  'plc-programming',
  'lubrication-engineering'
]

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
  category: string | null
}

type Module = {
  id: string
  title: string
  description: string | null
  module_order: number
  estimated_minutes: number | null
}

type Lesson = {
  id: string
  title: string
  module_id: string
  content_type: string | null
  duration_minutes: number | null
  lesson_order: number
  is_published: boolean | null
  content_url: string | null
}

type ModuleWithLessons = Module & {
  lessons: Lesson[]
}

type LessonProgress = {
  lesson_id: string
  completed: boolean
  quiz_score: number | null
}

// Server action for enrollment - defined at top level
async function enrollInCourse(formData: FormData) {
  'use server'

  const courseId = formData.get('courseId') as string
  const slug = formData.get('slug') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      progress_percentage: 0
    })

  if (!error) {
    redirect(`/dashboard/learn/${slug}`)
  }
}

export default async function CoursePage({
  params,
}: {
  params: { slug: string }
}) {
  try {
    console.log('=== COURSE PAGE DEBUG ===')
    console.log('1. Starting CoursePage with slug:', params.slug)
    
    const supabase = await createClient()
    console.log('2. Supabase client created')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('3. Auth check:', { user: user?.id, authError })
    
    if (!user) {
      console.log('4. No user, redirecting to login')
      redirect('/login')
    }

    // Check if this is an approved course
    if (!APPROVED_COURSE_SLUGS.includes(params.slug)) {
      console.log('Course not in approved list:', params.slug)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <Film size={48} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Under Maintenance</h1>
            <p className="text-gray-600 mb-6">
              This course is currently being updated with new video content. 
              Please check back soon or explore our other available courses.
            </p>
            <Link 
              href="/dashboard/courses" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Browse Available Courses
            </Link>
          </div>
        </div>
      )
    }

    console.log('5. Fetching course with slug:', params.slug)

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single()

    console.log('6. Course query result:', { 
      courseId: course?.id, 
      courseTitle: course?.title,
      courseError: courseError?.message,
      courseErrorCode: courseError?.code
    })

    if (courseError || !course) {
      console.error('Course error details:', courseError)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">The course "{params.slug}" could not be found.</p>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )
    }

    console.log('7. Checking enrollment for user:', user.id, 'course:', course.id)

    // Check if user is enrolled
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('status, progress_percentage, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()

    console.log('8. Enrollment result:', { 
      isEnrolled: !!enrollment, 
      enrollmentError: enrollmentError?.message,
      progress: enrollment?.progress_percentage 
    })

    const isEnrolled = !!enrollment

    console.log('9. Fetching modules for course:', course.id)

    // Get all modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        module_order,
        estimated_minutes,
        course_id
      `)
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('module_order', { ascending: true })

    console.log('10. Modules query result:', { 
      moduleCount: modules?.length, 
      modulesError: modulesError?.message 
    })

    if (modulesError) {
      console.error('Modules error details:', modulesError)
    }

    // Get lessons for each module - including content_url to check for content
    let modulesWithLessons: ModuleWithLessons[] = []
    
    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)
      console.log('11. Fetching lessons for modules:', moduleIds)
      
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, module_id, content_type, duration_minutes, lesson_order, is_published, content_url')
        .in('module_id', moduleIds)
        .eq('is_published', true)
        .order('lesson_order', { ascending: true })

      console.log('12. Lessons query result:', { 
        lessonCount: lessons?.length, 
        lessonsError: lessonsError?.message 
      })

      if (lessonsError) {
        console.error('Lessons error details:', lessonsError)
      }

      // Group lessons by module_id
      const lessonsByModule: { [key: string]: Lesson[] } = {}
      if (lessons) {
        lessons.forEach(lesson => {
          if (!lessonsByModule[lesson.module_id]) {
            lessonsByModule[lesson.module_id] = []
          }
          lessonsByModule[lesson.module_id].push(lesson)
        })
      }

      // Combine modules with their lessons
      modulesWithLessons = modules.map(module => ({
        ...module,
        lessons: lessonsByModule[module.id] || []
      }))
      
      console.log('13. Modules with lessons:', modulesWithLessons.map(m => ({ 
        module: m.title, 
        lessonCount: m.lessons.length 
      })))
    }

    // Calculate content stats - ALL lessons with content (videos, HTML, interactive)
    const totalLessonsWithContent = modulesWithLessons.reduce((acc, m) => 
      acc + m.lessons.filter(l => l.content_url).length, 0
    )
    
    // Keep video count for display
    const totalVideoLessons = modulesWithLessons.reduce((acc, m) => 
      acc + m.lessons.filter(l => l.content_type === 'video' && l.content_url).length, 0
    )
    
    // Count HTML/interactive lessons
    const totalHtmlLessons = modulesWithLessons.reduce((acc, m) => 
      acc + m.lessons.filter(l => (l.content_type === 'html' || l.content_type === 'interactive') && l.content_url).length, 0
    )

    // If user is enrolled, get their progress
    let lessonProgress: LessonProgress[] = []
    if (isEnrolled) {
      // Get all lesson IDs for this course
      const lessonIds = modulesWithLessons.flatMap(m => 
        m.lessons.map(l => l.id)
      )

      console.log('14. Fetching progress for lessons:', lessonIds.length)

      if (lessonIds.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed, quiz_score')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)

        console.log('15. Progress query result:', { 
          progressCount: progress?.length, 
          progressError: progressError?.message 
        })

        if (progressError) {
          console.error('Progress error details:', progressError)
        }

        lessonProgress = progress || []
      }
    }

    // Calculate overall progress (for all lessons)
    const completedLessons = lessonProgress.filter(p => p.completed).length
    const overallProgressPercentage = totalLessonsWithContent > 0 
      ? Math.round((completedLessons / totalLessonsWithContent) * 100) 
      : 0

    console.log('16. Final stats:', { 
      totalLessonsWithContent, 
      completedLessons, 
      overallProgressPercentage,
      isEnrolled 
    })
    console.log('=== COURSE PAGE DEBUG END ===')

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                <span>Back to Dashboard</span>
              </Link>
              
              {/* Resources Tab */}
              <Link
                href={`/dashboard/learn/${params.slug}/resources`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FileText size={20} />
                <span>View Resources</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Thumbnail */}
              <div className="md:w-64 h-48 rounded-lg overflow-hidden shadow-lg">
                <CourseImage 
                  src={course.thumbnail_url}
                  alt={course.title}
                  title={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
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
                    {totalLessonsWithContent} lessons
                  </span>
                  {totalHtmlLessons > 0 && (
                    <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Code size={14} />
                      {totalHtmlLessons} interactive
                    </span>
                  )}
                  {course.enrollment_count && (
                    <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                      {course.enrollment_count} enrolled
                    </span>
                  )}
                </div>

                {/* Progress Bar (only shows if enrolled) */}
                {isEnrolled && totalLessonsWithContent > 0 && (
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Your progress</span>
                      <span>{overallProgressPercentage}% complete ({completedLessons}/{totalLessonsWithContent})</span>
                    </div>
                    <div className="w-full bg-blue-300 bg-opacity-30 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full" 
                        style={{ width: `${overallProgressPercentage}%` }}
                      />
                    </div>
                    {enrollment?.completed_at && (
                      <p className="text-sm mt-2 text-green-200">
                        ✓ Completed on {new Date(enrollment.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                {!isEnrolled && (
                  <form action={enrollInCourse}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="slug" value={params.slug} />
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

        {/* Course Content - Show ALL lessons with content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Description */}
          {course.description && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">About this course</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
            </div>
          )}

          {/* Content Warning if no lessons */}
          {totalLessonsWithContent === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-8 text-center">
              <BookOpen size={48} className="mx-auto text-yellow-400 mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Content Available</h3>
              <p className="text-yellow-700">
                This course doesn't have any lessons available at the moment. 
                Check back soon for updates!
              </p>
            </div>
          )}

          {/* Modules and Lessons - Show ALL lessons with content */}
          {totalLessonsWithContent > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Course Lessons</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {totalLessonsWithContent} lesson{totalLessonsWithContent !== 1 ? 's' : ''} available
                </p>
              </div>

              <div className="divide-y">
                {modulesWithLessons.map((module) => {
                  // Filter lessons to show ALL lessons with content
                  const lessonsWithContent = module.lessons.filter(l => l.content_url)
                  
                  if (lessonsWithContent.length === 0) return null
                  
                  const completedInModule = lessonsWithContent.filter(
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
                          <span className="flex items-center gap-1">
                            <BookOpen size={16} />
                            {lessonsWithContent.length} lessons
                          </span>
                          {module.estimated_minutes && (
                            <span>{module.estimated_minutes} min total</span>
                          )}
                          {isEnrolled && lessonsWithContent.length > 0 && (
                            <span className="text-green-600">
                              {completedInModule} of {lessonsWithContent.length} completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lessons List */}
                      <div className="space-y-2">
                        {lessonsWithContent.map((lesson) => {
                          const progress = lessonProgress.find(p => p.lesson_id === lesson.id)
                          const isCompleted = progress?.completed || false
                          const isLocked = !isEnrolled
                          const isVideo = lesson.content_type === 'video'
                          const isHtml = lesson.content_type === 'html' || lesson.content_type === 'interactive'

                          // For non-enrolled users, render a div with lock icon
                          if (!isEnrolled) {
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 rounded-lg cursor-not-allowed opacity-75"
                              >
                                <div className="flex items-center gap-3">
                                  <Lock size={18} className="text-gray-400" />
                                  <div>
                                    <span className="font-medium">
                                      {lesson.lesson_order}. {lesson.title}
                                    </span>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                      {isVideo && (
                                        <span className="flex items-center gap-1">
                                          <Film size={12} />
                                          Video
                                        </span>
                                      )}
                                      {isHtml && (
                                        <span className="flex items-center gap-1">
                                          <Code size={12} />
                                          Interactive
                                        </span>
                                      )}
                                      {lesson.duration_minutes && (
                                        <span>{lesson.duration_minutes} min</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          // For enrolled users, render a clickable Link
                          return (
                            <Link
                              key={lesson.id}
                              href={`/dashboard/learn/${params.slug}/${lesson.id}`}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle size={18} className="text-green-600" />
                                ) : (
                                  <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-300" />
                                )}
                                <div>
                                  <span className="font-medium">
                                    {lesson.lesson_order}. {lesson.title}
                                  </span>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    {isVideo && (
                                      <span className="flex items-center gap-1">
                                        <Film size={12} />
                                        Video
                                      </span>
                                    )}
                                    {isHtml && (
                                      <span className="flex items-center gap-1">
                                        <Code size={12} />
                                        Interactive
                                      </span>
                                    )}
                                    {lesson.duration_minutes && (
                                      <span>{lesson.duration_minutes} min</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-blue-600 text-sm">
                                {isCompleted ? 'Review' : 'Start'}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Unexpected error in CoursePage:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h1>
          <p className="text-gray-600 mb-6">We encountered an error while loading this page.</p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
