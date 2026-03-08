import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LearnPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  // First, get the course ID from the slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', params.slug)
    .single()

  console.log('Course query result:', { course, courseError })

  if (!course) {
    return <div>Course not found: {params.slug}</div>
  }

  // Check if user is enrolled
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  console.log('Enrollment check:', { enrollment, enrollError })

  if (!enrollment) {
    redirect(`/dashboard/courses/${params.slug}`)
  }

  // Get all lessons for this course with their modules
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      lesson_order,
      module:modules!inner(
        id,
        module_order,
        course_id
      )
    `)
    .eq('module.course_id', course.id)
    .order('module.module_order', { ascending: true })
    .order('lesson_order', { ascending: true })

  console.log('Lessons query:', { lessons, lessonsError, count: lessons?.length })

  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p><strong>Course:</strong> {course.title}</p>
          <p><strong>Course ID:</strong> {course.id}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Enrollment:</strong> {enrollment ? 'Yes' : 'No'}</p>
          <p><strong>Lessons found:</strong> {lessons?.length || 0}</p>
          {lessonsError && <p><strong>Error:</strong> {lessonsError.message}</p>}
        </div>
        <p>No lessons found for this course.</p>
      </div>
    )
  }

  // Get completed lessons for this user
  const { data: completedData, error: completedError } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('completed', true)
    .in('lesson_id', lessons.map(l => l.id))

  console.log('Completed lessons:', { completedData, completedError })

  const completedLessonIds = new Set(completedData?.map(c => c.lesson_id) || [])

  // Find the first incomplete lesson
  const firstIncompleteLesson = lessons.find(l => !completedLessonIds.has(l.id))

  console.log('First incomplete:', firstIncompleteLesson)

  // Instead of redirecting, show the debug info with links
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Course: {course.title}</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Debug Info:</h2>
        <p>Course ID: {course.id}</p>
        <p>User ID: {user.id}</p>
        <p>Enrolled: ✅ Yes</p>
        <p>Total Lessons: {lessons.length}</p>
        <p>Completed Lessons: {completedLessonIds.size}</p>
        <p>First Incomplete: {firstIncompleteLesson?.title || 'None'}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">All Lessons:</h2>
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <div 
              key={lesson.id}
              className={`p-3 border rounded-lg flex items-center justify-between ${
                completedLessonIds.has(lesson.id) ? 'bg-green-50' : 'bg-white'
              }`}
            >
              <div>
                <span className="text-sm text-gray-500 mr-2">#{index + 1}</span>
                <span className="font-medium">{lesson.title}</span>
                <span className="text-xs text-gray-400 ml-2">ID: {lesson.id}</span>
              </div>
              <Link
                href={`/dashboard/learn/${params.slug}/${lesson.id}`}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Go to Lesson
              </Link>
            </div>
          ))}
        </div>
      </div>

      {firstIncompleteLesson && (
        <div className="mt-6">
          <Link
            href={`/dashboard/learn/${params.slug}/${firstIncompleteLesson.id}`}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Continue to First Incomplete Lesson
          </Link>
        </div>
      )}
    </div>
  )
}
