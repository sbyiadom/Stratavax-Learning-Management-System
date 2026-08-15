import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, Users, ChevronLeft, PlayCircle, Award, Star } from 'lucide-react'
import CourseImage from '@/components/shared/CourseImage'

// Approved course slugs - All courses that are available
const APPROVED_COURSE_SLUGS = [
  // New Leadership Courses
  'effective-leadership-talent-management',
  'power-influence-leadership',
  'leading-inclusive-workforce',
  
  // New Personal Development Courses
  'personality-transformations',
  'assertive-communication-eq',
  'mental-reset-wellness',
  
  // New Programming Courses
  'cs50-web-programming',
  'cs50-computer-science',
  
  // Existing Courses
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
  'business-growth-strategy',
  'marketing-sales',
  'digital-marketing',
  'leadership',
  'basic-mechanical-engineering'
]

// Maps course slugs to local images - Using exact filenames
const getLocalImage = (slug: string): string | null => {
  const imageMap: Record<string, string> = {
    // New Courses - Exact filenames
    'effective-leadership-talent-management': '/images/Effective Leadership.jpg',
    'power-influence-leadership': '/images/Power and influence.jpg',
    'leading-inclusive-workforce': '/images/Inlusive workforce.jpg',
    'personality-transformations': '/images/Personality Transformation.jpg',
    'assertive-communication-eq': '/images/Assertive communication.jpg',
    'mental-reset-wellness': '/images/Mental reset and wellness.jpg',
    'cs50-web-programming': '/images/CS50 Web Programming.jpg',
    'cs50-computer-science': '/images/CS50 Computer Science.jpg',
    
    // Existing Courses
    'business-model-design': '/images/business-model-design.jpg',
    'business-plan-development': '/images/business-plan-development.jpg',
    'data-analysis': '/images/data-analysis.jpg',
    'digital-marketing': '/images/digital-marketing.jpg',
    'ai-fundamentals': '/images/AI-Fundamentals.jpg',
    'microsoft-office': '/images/microsoft-office.jpg',
    'basic-mechanical-engineering': '/images/basic-mechanical-engineering.jpg',
    'electrical-engineering': '/images/electrical-engineering.jpg',
    'financial-literacy': '/images/financial-literacy.jpg',
    'leadership': '/images/leadership.jpg',
    'marketing-sales': '/images/marketing-&-sale.jpg',
    'programming-fundamentals': '/images/programming-fundamental.jpg',
  }
  return imageMap[slug] || null
}

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
  is_published: boolean | null
  created_at: string | null
  updated_at: string | null
}

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get course details by ID
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.courseId)
    .eq('is_published', true)
    .single() as { data: Course | null, error: any }

  if (courseError || !course) {
    console.error('Course error:', courseError)
    notFound()
  }

  // Check if this is an approved course by slug
  if (!APPROVED_COURSE_SLUGS.includes(course.slug)) {
    notFound()
  }

  // Check if user is already enrolled (only if user is logged in)
  let isEnrolled = false
  
  if (user?.id) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()

    isEnrolled = !!enrollment
  }

  // Get modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, description, module_order')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('module_order', { ascending: true })

  // Get lesson counts
  const modulesWithCount = []
  if (modules) {
    for (const module of modules) {
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', module.id)
        .eq('is_published', true)
      
      modulesWithCount.push({
        id: module.id,
        title: module.title,
        description: module.description,
        module_order: module.module_order,
        lesson_count: count || 0
      })
    }
  }

  const totalLessons = modulesWithCount.reduce((acc, m) => acc + m.lesson_count, 0)
  
  const imageSource = getLocalImage(course.slug) || course.thumbnail_url

  // ============================================================
  // ✅ FIXED: Enrollment Server Action - removed updated_at
  // ============================================================
  async function enrollInCourse() {
    'use server'
    
    if (!user) {
      redirect('/login')
    }
    
    if (!course) {
      console.error('Course not found')
      redirect('/dashboard/courses')
    }
    
    const supabase = await createClient()
    
    // Check if already enrolled
    const { data: existingEnrollment, error: existingError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()
    
    if (existingError) {
      console.error('Error checking existing enrollment:', existingError)
      redirect(`/dashboard/courses/${course.id}`)
    }
    
    if (existingEnrollment) {
      // Already enrolled - go to learning
      redirect(`/dashboard/learn/${course.id}`)
    }
    
    // ✅ FIXED: Remove updated_at - it doesn't exist in enrollments table
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: course.id,
        status: 'active',
        progress_percentage: 0,
        enrolled_at: new Date().toISOString()
        // ✅ updated_at removed - this was the root cause
      })

    if (enrollError) {
      console.error('Error enrolling:', enrollError)
      redirect(`/dashboard/courses/${course.id}?error=enrollment_failed`)
    }

    // Get actual enrollment count
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id)

    // Update course enrollment count (courses table DOES have updated_at)
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        enrollment_count: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', course.id)

    if (updateError) {
      console.error('Error updating enrollment count:', updateError)
    }

    // ✅ Redirect to learning page on success
    redirect(`/dashboard/learn/${course.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard/courses" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
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
                src={imageSource}
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
                    <Star size={12} /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.short_description || course.description}</p>
              
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
                <Link href={`/dashboard/learn/${course.id}`} className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
                  <PlayCircle size={20} className="mr-2" /> Continue Learning
                </Link>
              ) : (
                <form action={enrollInCourse}>
                  <button type="submit" className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
                    <BookOpen size={20} className="mr-2" /> Enroll Now
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
          <div className="lg:col-span-2 space-y-8">
            {course.description && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{course.description}</p>
              </div>
            )}

            {modulesWithCount.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Content</h2>
                <div className="space-y-4">
                  {modulesWithCount.map((module: any) => (
                    <div key={module.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Module {module.module_order}: {module.title}</h3>
                          {module.description && <p className="text-sm text-gray-500 mt-1">{module.description}</p>}
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {module.lesson_count} {module.lesson_count === 1 ? 'lesson' : 'lessons'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">What You'll Learn</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>Fundamental concepts and principles</li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>Hands-on practical applications</li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>Real-world examples and case studies</li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>Industry best practices</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• No prior experience needed</li>
                <li>• Basic computer skills</li>
                <li>• Internet connection</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Ready to start?</h3>
              <p className="text-sm text-blue-100 mb-4">Join {course.enrollment_count || 0} other learners</p>
              {isEnrolled ? (
                <Link href={`/dashboard/learn/${course.id}`} className="block w-full px-4 py-3 bg-white text-blue-600 rounded-lg text-center font-medium hover:bg-gray-50 transition">
                  Continue Learning
                </Link>
              ) : (
                <form action={enrollInCourse}>
                  <button type="submit" className="w-full px-4 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition">
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
