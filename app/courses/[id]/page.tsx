import { supabaseServer } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, Users, ChevronLeft, PlayCircle, Award, Star, Calendar } from 'lucide-react'
import CourseImage from '@/components/shared/CourseImage'

// Approved course slugs
const APPROVED_COURSE_SLUGS = [
  'electrical-engineering',
  'microsoft-office',
  'programming-fundamentals',
  'web-development',
  'data-analysis',
  'ai-fundamentals',
  'entrepreneurship-pathway',
  'financial-literacy',
  'business-model-design',
  'business-plan-development',
  'marketing-sales',
  'digital-marketing',
  'business-growth-strategy',
  'leadership',
  'basic-mechanical-engineering'
]

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  category: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
  duration_hours: number | null
  enrollment_count: number | null
  is_featured: boolean | null
  created_at: string | null
}

type Module = {
  id: string
  title: string
  description: string | null
  module_order: number
  lesson_count: number
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Check if user is authenticated
  const { data: { user } } = await supabaseServer.auth.getUser()
  
  // Get course details by ID
  const { data: course, error: courseError } = await supabaseServer
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (courseError || !course) {
    console.error('Course error:', courseError)
    notFound()
  }

  // Check if this is an approved course by slug
  if (!APPROVED_COURSE_SLUGS.includes(course.slug)) {
    notFound()
  }

  // Check if user is already enrolled
  const { data: existingEnrollment } = await supabaseServer
    .from('enrollments')
    .select('id')
    .eq('user_id', user?.id)
    .eq('course_id', course.id)
    .maybeSingle()

  const isEnrolled = !!existingEnrollment

  // Get modules for this course with lesson counts
  const { data: modules } = await supabaseServer
    .from('modules')
    .select(`
      id,
      title,
      description,
      module_order,
      lessons(count)
    `)
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('module_order', { ascending: true })

  const modulesWithCount = modules?.map(module => ({
    ...module,
    lesson_count: module.lessons?.[0]?.count || 0
  })) || []

  const totalLessons = modulesWithCount.reduce((acc, m) => acc + m.lesson_count, 0)

  // Handle enrollment
  async function enrollInCourse() {
    'use server'

    if (!user) {
      redirect('/login')
    }

    const { error } = await supabaseServer
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: course.id,
        status: 'active',
        progress_percentage: 0
      })

    if (!error) {
      redirect(`/dashboard/learn/${course.slug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/courses"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span>Back to Courses</span>
          </Link>
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
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-500 bg-opacity-30 text-white text-xs px-3 py-1 rounded-full">
                  {course.category?.split(' ')[0] || 'Course'}
                </span>
                {course.is_featured && (
                  <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} />
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">
                {course.short_description || course.description}
              </p>
              
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-blue-200" />
                  <span>{course.duration_hours || 0} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-200" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-200" />
                  <span>{course.enrollment_count || 0} enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-blue-200" />
                  <span className="capitalize">{course.difficulty_level || 'Beginner'}</span>
                </div>
              </div>

              {/* Action Button */}
              {isEnrolled ? (
                <Link
                  href={`/dashboard/learn/${course.slug}`}
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  <PlayCircle size={20} className="mr-2" />
                  Continue Learning
                </Link>
              ) : (
                <form action={enrollInCourse}>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                  >
                    <BookOpen size={20} className="mr-2" />
                    Enroll Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* About This Course */}
            {course.description && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
              </div>
            )}

            {/* Course Content */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Content</h2>
              <div className="space-y-4">
                {modulesWithCount.map((module) => (
                  <div key={module.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Module {module.module_order}: {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {module.lesson_count} lessons
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {course.title[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stratavax Learning</p>
                  <p className="text-sm text-gray-500">Expert Instructors</p>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">What You'll Learn</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Fundamental concepts and principles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Hands-on practical applications</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Real-world examples and case studies</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Industry best practices</span>
                </li>
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• No prior experience needed</li>
                <li>• Basic computer skills</li>
                <li>• Internet connection</li>
              </ul>
            </div>

            {/* Enroll CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Ready to start?</h3>
              <p className="text-sm text-blue-100 mb-4">Join {course.enrollment_count || 0} other learners</p>
              {isEnrolled ? (
                <Link
                  href={`/dashboard/learn/${course.slug}`}
                  className="block w-full px-4 py-3 bg-white text-blue-600 rounded-lg text-center font-medium hover:bg-gray-50 transition"
                >
                  Continue Learning
                </Link>
              ) : (
                <form action={enrollInCourse}>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Enroll Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
