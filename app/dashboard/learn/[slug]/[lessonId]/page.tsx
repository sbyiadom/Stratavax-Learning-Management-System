import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, Circle, BookOpen, Clock, Award, ThumbsUp, MessageSquare, Share2, ChevronRight } from 'lucide-react'
import LessonContent from '@/components/dashboard/LessonContent'

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get lesson details
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      *,
      modules:module_id (
        id,
        title,
        course_id
      )
    `)
    .eq('id', params.lessonId)
    .single()

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lesson Not Found</h1>
          <p className="text-gray-500 mb-6">The lesson you're looking for doesn't exist.</p>
          <Link href={`/dashboard/learn/${params.slug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg">
            <ChevronLeft size={18} />
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('title, slug, description')
    .eq('slug', params.slug)
    .single()

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress_percentage, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', lesson.modules.course_id)
    .maybeSingle()

  const isEnrolled = !!enrollment

  // Get lesson progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed, completed_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .maybeSingle()

  const isCompleted = progress?.completed || false

  // Get next lesson
  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('module_id', lesson.module_id)
    .gt('lesson_order', lesson.lesson_order)
    .order('lesson_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Get previous lesson
  const { data: prevLesson } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('module_id', lesson.module_id)
    .lt('lesson_order', lesson.lesson_order)
    .order('lesson_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Mark lesson as complete
  const markComplete = async () => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: params.lessonId,
        completed: true,
        completed_at: new Date().toISOString()
      })
    
    // Update enrollment progress
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('module_id', lesson.module_id)
    
    const { data: completedLessons } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('lesson_id', allLessons?.map(l => l.id) || [])
    
    const progressPercentage = allLessons?.length 
      ? Math.round((completedLessons?.length || 0) / allLessons.length * 100)
      : 0
    
    await supabase
      .from('enrollments')
      .update({ progress_percentage: progressPercentage })
      .eq('user_id', user.id)
      .eq('course_id', lesson.modules.course_id)
    
    // Redirect to refresh
    redirect(`/dashboard/learn/${params.slug}/${params.lessonId}`)
  }

  // Extract YouTube video ID for embed
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const videoUrl = getYouTubeEmbedUrl(lesson.content_url)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link
              href={`/dashboard/learn/${params.slug}`}
              className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition" />
              <span className="text-sm font-medium">Back to Course</span>
            </Link>
            <div className="flex items-center gap-3">
              {isCompleted ? (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <CheckCircle size={14} />
                  Completed
                </span>
              ) : isEnrolled && (
                <form action={markComplete}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                  >
                    <CheckCircle size={14} />
                    Mark Complete
                  </button>
                </form>
              )}
              <div className="text-sm text-gray-500 hidden sm:block">
                {course?.title}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Lesson {lesson.lesson_order}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>{lesson.duration_minutes || '~5'} min</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {lesson.title}
          </h1>
          <p className="text-gray-600">
            {lesson.description || 'Complete this lesson to continue your learning journey.'}
          </p>
        </div>

        {/* Video/Content Player */}
        <div className="mb-8">
          <LessonContent 
            lesson={lesson} 
            contentType={lesson.content_type || 'video'}
            onComplete={markComplete}
          />
        </div>

        {/* Lesson Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
          {prevLesson ? (
            <Link
              href={`/dashboard/learn/${params.slug}/${prevLesson.id}`}
              className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
            >
              <ChevronLeft size={18} className="text-gray-400 group-hover:-translate-x-0.5 transition" />
              <div>
                <p className="text-xs text-gray-500">Previous Lesson</p>
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">
                  {prevLesson.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          
          {nextLesson ? (
            <Link
              href={`/dashboard/learn/${params.slug}/${nextLesson.id}`}
              className="group flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md"
            >
              <div className="text-right">
                <p className="text-xs text-blue-200">Next Lesson</p>
                <p className="text-sm font-medium">{nextLesson.title}</p>
              </div>
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/learn/${params.slug}`}
              className="group flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-md"
            >
              <span>Complete Course</span>
              <Award size={18} className="group-hover:scale-110 transition" />
            </Link>
          )}
        </div>

        {/* Course Progress Card */}
        {isEnrolled && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-4 flex-wrap justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Course Progress</h3>
                  <p className="text-sm text-gray-600">{enrollment?.progress_percentage || 0}% Complete</p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${enrollment?.progress_percentage || 0}%` }}
                  />
                </div>
              </div>
              <Link
                href={`/dashboard/learn/${params.slug}`}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
              >
                View All Lessons
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
