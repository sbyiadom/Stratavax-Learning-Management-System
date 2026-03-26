import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, PlayCircle } from 'lucide-react'

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
    .select('*, modules(course_id)')
    .eq('id', params.lessonId)
    .single()

  if (lessonError || !lesson) {
    console.error('Lesson error:', lessonError)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lesson Not Found</h1>
          <Link href={`/dashboard/learn/${params.slug}`} className="text-blue-600 underline">
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  // Get course title
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('slug', params.slug)
    .single()

  // Extract YouTube video ID from URL
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const videoUrl = getYouTubeEmbedUrl(lesson.content_url)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/learn/${params.slug}`}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              <span>Back to Course</span>
            </Link>
            <div className="text-sm text-gray-500">
              {course?.title}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>

        {/* Video Player */}
        {videoUrl && (
          <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
            <div className="aspect-video">
              <iframe
                src={videoUrl}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* HTML Content */}
        {lesson.content_type === 'html' && lesson.content_url && !videoUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_url }} />
          </div>
        )}

        {/* No Content */}
        {!videoUrl && !lesson.content_url && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <PlayCircle size={48} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Video Available</h3>
            <p className="text-yellow-700">
              This lesson doesn't have video content yet. Check back soon!
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href={`/dashboard/learn/${params.slug}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            ← Back to Course
          </Link>
        </div>
      </div>
    </div>
  )
}
