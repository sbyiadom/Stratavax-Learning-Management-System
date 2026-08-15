import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'
import { 
  BookOpen, 
  Clock, 
  Award, 
  Users, 
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  Zap,
  Target,
  Shield,
  Sparkles,
  ChevronRight,
  GraduationCap,
  BarChart,
  TrendingUp,
  MessageCircle,
  Share2,
  Bookmark,
  Star,
  Calendar
} from 'lucide-react'
import EnrollButton from '@/components/dashboard/EnrollButton'

// Types
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
  short_description: string | null
  category: string | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  duration_hours: number | null
  learning_objectives?: string[] | null
  prerequisites?: string[] | null
  modules?: Module[]
  enrollments?: any[]
  enrollment_count?: number | null
  instructor?: string | null
  last_updated?: string | null
  is_featured?: boolean | null
  is_published?: boolean | null
  thumbnail_url?: string | null
}

// Difficulty level badges with enhanced styling
const difficultyConfig = {
  beginner: { 
    label: 'Beginner',
    color: 'bg-emerald-100 text-emerald-700',
    icon: '🌱',
    description: 'No prior experience needed'
  },
  intermediate: { 
    label: 'Intermediate',
    color: 'bg-amber-100 text-amber-700',
    icon: '⚡',
    description: 'Some experience recommended'
  },
  advanced: { 
    label: 'Advanced',
    color: 'bg-rose-100 text-rose-700',
    icon: '🚀',
    description: 'Expert-level knowledge'
  },
}

// Lesson type icons
const lessonIcons: Record<string, any> = {
  video: PlayCircle,
  reading: FileText,
  quiz: HelpCircle,
  project: Award,
  assignment: FileText,
  discussion: MessageCircle,
}

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
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
    .eq('id', params.courseId)
    .eq('is_published', true)
    .single()

  if (error || !course) {
    console.error('Course error:', error)
    notFound()
  }

  const typedCourse = course as unknown as Course

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', typedCourse.id)
    .single()

  let completedLessons = new Set<string>()
  if (enrollment && typedCourse.modules) {
    const allLessonIds = typedCourse.modules.flatMap((m: Module) => 
      m.lessons?.map((l: Lesson) => l.id) || []
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

  const totalLessons = typedCourse.modules?.reduce(
    (acc: number, m: Module) => acc + (m.lessons?.length || 0), 
    0
  ) || 0

  const completedCount = completedLessons.size
  const progress = enrollment ? Math.round((completedCount / totalLessons) * 100) : 0

  // Get course image - with fallback
  const courseImage = getCourseImage(typedCourse.slug, typedCourse.title) || '/images/placeholder-course.jpg'

  // Default learning objectives if none provided
  const learningObjectives = typedCourse.learning_objectives || [
    'Master core concepts and practical applications',
    'Develop hands-on skills through real-world projects',
    'Understand industry best practices and standards',
    'Build a portfolio of completed work',
    'Gain confidence to apply skills professionally'
  ]

  // Default prerequisites if none provided
  const prerequisites = typedCourse.prerequisites || [
    'Basic computer literacy',
    'Willingness to learn and practice',
    'Access to a computer with internet connection',
    'No prior experience required'
  ]

  const difficulty = typedCourse.difficulty_level 
    ? difficultyConfig[typedCourse.difficulty_level] 
    : difficultyConfig.beginner

  const enrollmentCount = typedCourse.enrollment_count || 0
  const durationHours = typedCourse.duration_hours || 0
  const category = typedCourse.category?.split(' ')[0] || 'Course'
  const isFeatured = typedCourse.is_featured || false

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section with Image */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard/courses"
              className="text-gray-300 hover:text-white transition flex items-center gap-1 text-sm"
            >
              <ArrowLeft size={16} />
              Back to Courses
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xs font-medium px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  {category}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm ${difficulty.color}`}>
                  {difficulty.icon} {difficulty.label}
                </span>
                {isFeatured && (
                  <span className="text-xs font-medium px-3 py-1 bg-amber-500/20 text-amber-200 rounded-full backdrop-blur-sm flex items-center gap-1">
                    <Star size={12} />
                    Featured
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{typedCourse.title}</h1>
              <p className="text-lg text-gray-300 mb-6">
                {typedCourse.short_description || typedCourse.description?.substring(0, 150)}
              </p>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{durationHours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{enrollmentCount} enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} />
                  <span className="capitalize">{difficulty.label} level</span>
                </div>
              </div>
            </div>

            {/* Course Image Card */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <div className="relative h-48 w-full bg-gradient-to-br from-gray-800 to-gray-900">
                  <CourseImage
                    src={courseImage}
                    alt={typedCourse.title}
                    title={typedCourse.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  {enrollment ? (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-white mb-1">
                          <span>Your Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/learn/${typedCourse.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
                      >
                        <PlayCircle size={18} />
                        Continue Learning
                      </Link>
                    </>
                  ) : (
                    <EnrollButton courseId={typedCourse.id} courseSlug={typedCourse.slug} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About This Course */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                About This Course
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {typedCourse.description}
              </p>
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningObjectives.map((objective: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{objective}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-600" />
                    Course Content
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{typedCourse.modules?.length || 0} modules</span>
                    <span>•</span>
                    <span>{totalLessons} lessons</span>
                    <span>•</span>
                    <span>{durationHours} hours</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {typedCourse.modules?.map((module: Module, idx: number) => {
                  const completedInModule = module.lessons?.filter(l => completedLessons.has(l.id)).length || 0
                  const moduleProgress = module.lessons?.length 
                    ? Math.round((completedInModule / module.lessons.length) * 100) 
                    : 0
                  
                  return (
                    <div key={module.id} className="hover:bg-gray-50 transition">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              Module {idx + 1}
                            </span>
                            <h3 className="font-semibold text-gray-900">{module.title}</h3>
                          </div>
                          <span className="text-xs text-gray-400">
                            {module.lessons?.length || 0} lessons • {module.estimated_minutes || 'N/A'} min
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{module.description}</p>
                        
                        {moduleProgress > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{moduleProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full transition-all"
                                style={{ width: `${moduleProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {module.lessons && module.lessons.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {module.lessons.map((lesson: Lesson) => {
                              const Icon = lessonIcons[lesson.content_type] || FileText
                              const isCompleted = completedLessons.has(lesson.id)
                              
                              return (
                                <div key={lesson.id} className="flex items-center justify-between py-1.5 pl-6">
                                  <div className="flex items-center gap-2">
                                    <Icon size={14} className={isCompleted ? 'text-emerald-500' : 'text-gray-400'} />
                                    <span className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-700'}`}>
                                      {lesson.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{lesson.duration_minutes} min</span>
                                    {isCompleted && <CheckCircle size={12} className="text-emerald-500" />}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Course Details</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Clock size={14} />
                    Duration
                  </span>
                  <span className="font-medium text-gray-900">{durationHours} hours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <BookOpen size={14} />
                    Total Lessons
                  </span>
                  <span className="font-medium text-gray-900">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Users size={14} />
                    Enrolled Students
                  </span>
                  <span className="font-medium text-gray-900">{enrollmentCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Award size={14} />
                    Level
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficulty.color}`}>
                    {difficulty.label}
                  </span>
                </div>
                {typedCourse.last_updated && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar size={14} />
                      Last Updated
                    </span>
                    <span className="text-gray-700 text-sm">
                      {new Date(typedCourse.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!enrollment && (
                <EnrollButton courseId={typedCourse.id} courseSlug={typedCourse.slug} />
              )}

              {/* Prerequisites */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield size={14} className="text-gray-500" />
                  Prerequisites
                </h3>
                <ul className="space-y-2">
                  {prerequisites.map((prereq: string, idx: number) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Share Options */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Bookmark size={14} />
                    Save
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Share2 size={14} />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Instructor Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-600" />
                Instructor
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {typedCourse.title.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stratavax Academy</p>
                  <p className="text-xs text-gray-500">Expert Instructors Team</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Industry experts with years of practical experience in {category}
              </p>
            </div>

            {/* Certificate Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Award className="text-amber-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Certificate of Completion</h3>
              </div>
              <p className="text-xs text-gray-600">
                Earn a certificate upon completing all course requirements. Share your achievement on LinkedIn and your resume.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
