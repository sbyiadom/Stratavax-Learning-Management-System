import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, AlertCircle } from 'lucide-react'
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

  // For now, since we don't have the database tables set up,
  // let's create a temporary lesson based on the lessonId
  const lessonId = params.lessonId
  
  // Check if this is the known lesson from your screenshot
  if (lessonId === 'fcfdff91-b8af-4440-8cc6-5453095c8105') {
    // Temporary lesson data
    const tempLesson = {
      id: 'fcfdff91-b8af-4440-8cc6-5453095c8105',
      title: 'Introduction to Computers',
      content_type: 'video',
      content: {
        videoUrl: 'https://www.youtube.com/watch?v=example',
        description: 'In this lesson, you will learn the basics of computers, including hardware, software, and how they work together.'
      },
      lesson_order: 1,
      module_id: 'temp-module-1',
      module: {
        id: 'temp-module-1',
        title: 'Getting Started',
        module_order: 1,
        course_id: 'basic-computer-literacy'
      }
    }

    // Temporary navigation lessons
    const tempAllLessons = [
      {
        id: 'fcfdff91-b8af-4440-8cc6-5453095c8105',
        title: 'Introduction to Computers',
        lesson_order: 1,
        module: { module_order: 1 }
      },
      {
        id: 'temp-lesson-2',
        title: 'Computer Hardware',
        lesson_order: 2,
        module: { module_order: 1 }
      },
      {
        id: 'temp-lesson-3',
        title: 'Computer Software',
        lesson_order: 3,
        module: { module_order: 1 }
      }
    ]

    // Find current index and navigation lessons
    const currentIndex = tempAllLessons.findIndex(l => l.id === lessonId)
    const prevLesson = currentIndex > 0 ? tempAllLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < tempAllLessons.length - 1 ? tempAllLessons[currentIndex + 1] : null

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
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Lesson {tempLesson.lesson_order} • {tempLesson.content_type}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-6">{tempLesson.title}</h1>
            
            {/* Video placeholder */}
            <div className="aspect-video bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">🎥</div>
                <p className="text-gray-500">Video lesson coming soon</p>
              </div>
            </div>

            {/* Description */}
            <div className="prose max-w-none mb-8">
              <h3>About this lesson</h3>
              <p>{tempLesson.content.description}</p>
              
              <h3>What you'll learn</h3>
              <ul>
                <li>What is a computer?</li>
                <li>Basic computer components</li>
                <li>How computers process information</li>
                <li>Types of computers</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              {prevLesson ? (
                <Link
                  href={`/dashboard/learn/${params.slug}/${prevLesson.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ← Previous Lesson
                </Link>
              ) : (
                <div />
              )}
              
              {nextLesson ? (
                <Link
                  href={`/dashboard/learn/${params.slug}/${nextLesson.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Next Lesson →
                </Link>
              ) : (
                <Link
                  href={`/dashboard/learn/${params.slug}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Complete Course
                </Link>
              )}
            </div>
          </div>

          {/* Development Notice */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-800">Development Mode</h3>
                <p className="text-yellow-700 text-sm">
                  This is a temporary lesson page. The database tables for lessons are being set up.
                  Full functionality will be available soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If lesson ID doesn't match known ones, redirect to course page
  redirect(`/dashboard/learn/${params.slug}`)
}
