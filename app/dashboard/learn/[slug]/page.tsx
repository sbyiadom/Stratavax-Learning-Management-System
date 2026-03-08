import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen, Clock } from 'lucide-react'

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

  // Course data based on slug
  const courseInfo: Record<string, { title: string; description: string; lessons: any[] }> = {
    'basic-computer-literacy': {
      title: 'Basic Computer Literacy',
      description: 'Learn the fundamentals of using computers, from hardware basics to essential software skills.',
      lessons: [
        {
          id: 'fcfdff91-b8af-4440-8cc6-5453095c8105',
          title: 'Introduction to Computers',
          duration: '10 min',
          type: 'video'
        },
        {
          id: 'temp-lesson-2',
          title: 'Computer Hardware Basics',
          duration: '15 min',
          type: 'video'
        },
        {
          id: 'temp-lesson-3',
          title: 'Operating Systems',
          duration: '12 min',
          type: 'video'
        }
      ]
    }
    // Add more courses as needed
  }

  const course = courseInfo[params.slug]

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">{course.description}</p>
          <div className="flex items-center gap-4 mt-6">
            <span className="flex items-center gap-1">
              <BookOpen size={18} />
              {course.lessons.length} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock size={18} />
              ~{course.lessons.length * 10} min total
            </span>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Course Content</h2>
        <div className="bg-white rounded-xl shadow-lg divide-y">
          {course.lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/dashboard/learn/${params.slug}/${lesson.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition group"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {lesson.type} • {lesson.duration}
                  </p>
                </div>
              </div>
              <span className="text-blue-600">Start →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
