import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import InsightCard from '@/components/InsightCard'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'
import { 
  BookOpen, Clock, Award, TrendingUp, ChevronRight, 
  FileSpreadsheet, Plus, ExternalLink, ArrowRight,
  BarChart3, Calendar, Target, Sparkles, PlayCircle,
  Trophy, Users, Star, CheckCircle2, Activity, Zap
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // Get user's profile with name and role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  
  // Get user enrollments with course details
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, 
      course_id, 
      progress_percentage,
      enrolled_at,
      status,
      courses:course_id (
        id, 
        title, 
        slug, 
        duration_hours, 
        category, 
        difficulty_level, 
        thumbnail_url,
        description
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
  
  // Get certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
  
  // Get lesson progress
  const { data: lessonProgress } = await supabase
    .from('progress')
    .select('completed, lesson_id')
    .eq('user_id', user.id)
  
  // Get total lessons across enrolled courses
  let totalLessons = 0
  let completedLessons = 0
  
  if (enrollments && enrollments.length > 0) {
    const courseIds = enrollments.map(e => e.course_id)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, course_id')
      .in('course_id', courseIds)
    
    totalLessons = lessons?.length || 0
    completedLessons = lessonProgress?.filter(p => p.completed).length || 0
  }
  
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Calculate average progress across enrolled courses
  const avgProgress = enrollments && enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0
  
  // Get completed courses count
  const completedCourses = enrollments?.filter(e => e.progress_percentage === 100).length || 0
  
  const firstName = profile?.first_name || user.email?.split('@')[0] || 'Learner'
  const lastName = profile?.last_name || ''
  const fullName = lastName ? `${firstName} ${lastName}` : firstName
  
  const isAdmin = profile?.role === 'admin'
  const validEnrollments = enrollments?.filter(e => e.courses) || []
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  
  // Get days since first enrollment
  const firstEnrollment = validEnrollments[0]?.enrolled_at
  const daysSinceStart = firstEnrollment 
    ? Math.floor((new Date().getTime() - new Date(firstEnrollment).getTime()) / (1000 * 3600 * 24))
    : 0
  
  // Motivational quotes array
  const quotes = [
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi", icon: "🌟" },
    { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan", icon: "📚" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King", icon: "💡" },
    { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela", icon: "🌍" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", icon: "✨" },
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert", icon: "🎁" },
  ]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
  
  // Get recent activity (last 3 lessons accessed)
  const { data: recentProgress } = await supabase
    .from('progress')
    .select('lesson_id, updated_at, completed')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <DashboardSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Enhanced Hero Section */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600')] opacity-10 bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-transparent to-slate-900/90"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl">{greeting === 'Good morning' ? '🌅' : greeting === 'Good afternoon' ? '☀️' : '🌙'}</span>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm font-medium tracking-wide">Welcome back</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      {firstName} {lastName}
                    </h1>
                  </div>
                </div>
                
                {/* Streak or Achievement Badge */}
                {daysSinceStart > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm font-medium">{daysSinceStart} Day Learning Streak</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-gray-300 text-lg mb-4">
                    Continue your professional development journey
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {validEnrollments.length > 0 && (
                      <Link 
                        href={`/dashboard/learn/${validEnrollments[0]?.courses?.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-lg font-medium hover:bg-blue-50 transition shadow-lg"
                      >
                        <PlayCircle size={18} />
                        Continue Learning
                      </Link>
                    )}
                    <Link 
                      href="/dashboard/courses"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition"
                    >
                      <BookOpen size={18} />
                      Browse All Courses
                    </Link>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{randomQuote.icon}</span>
                    <div>
                      <p className="text-gray-200 text-sm italic">"{randomQuote.text}"</p>
                      <p className="text-gray-400 text-xs mt-2">— {randomQuote.author}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Cards - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                  <BookOpen className="text-blue-600" size={18} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{validEnrollments.length}</span>
              </div>
              <p className="text-gray-600 text-sm">Active Courses</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition">
                  <TrendingUp className="text-green-600" size={18} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{avgProgress}%</span>
              </div>
              <p className="text-gray-600 text-sm">Avg. Progress</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${avgProgress}%` }}></div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition">
                  <Award className="text-purple-600" size={18} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{certificates?.length || 0}</span>
              </div>
              <p className="text-gray-600 text-sm">Certificates</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition">
                  <CheckCircle2 className="text-orange-600" size={18} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{completedLessons}</span>
              </div>
              <p className="text-gray-600 text-sm">Lessons Done</p>
              <p className="text-xs text-gray-400 mt-1">of {totalLessons}</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition">
                  <Trophy className="text-indigo-600" size={18} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{completedCourses}</span>
              </div>
              <p className="text-gray-600 text-sm">Completed</p>
            </div>
          </div>
          
          <InsightCard />
          
          {/* Quick Actions - Enhanced */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Quick Actions
              </h2>
              <span className="text-xs text-gray-400">Get started in seconds</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-blue-200 hover:scale-[1.02] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                    <FileSpreadsheet className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Training Registration</h3>
                    <p className="text-sm text-gray-500">Submit training attendance and evaluation form</p>
                  </div>
                  <ExternalLink className="text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition" size={18} />
                </div>
              </a>
              
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-blue-200 hover:scale-[1.02] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                    <Plus className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Request a Course</h3>
                    <p className="text-sm text-gray-500">Suggest new training courses you'd like to see</p>
                  </div>
                  <ExternalLink className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" size={18} />
                </div>
              </a>
            </div>
          </div>
          
          {/* Recent Activity Section */}
          {recentProgress && recentProgress.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </h2>
                <Link href="/dashboard/progress" className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {recentProgress.map((progress, idx) => (
                  <div key={progress.lesson_id} className={`flex items-center gap-4 p-4 ${idx !== recentProgress.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      {progress.completed ? (
                        <CheckCircle2 className="text-green-500" size={20} />
                      ) : (
                        <BookOpen className="text-blue-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {progress.completed ? 'Completed a lesson' : 'Started a lesson'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(progress.updated_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* My Courses - Enhanced with Images */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                My Learning Journey
              </h2>
              <Link href="/dashboard/courses" className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                Browse all <ChevronRight size={14} />
              </Link>
            </div>
            
            {validEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {validEnrollments.map((enrollment: any) => {
                  const progress = enrollment.progress_percentage || 0
                  const course = enrollment.courses
                  const courseImage = getCourseImage(course.slug, course.title)
                  
                  return (
                    <Link
                      key={enrollment.id}
                      href={`/dashboard/learn/${course.slug}`}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                    >
                      {/* Image Container */}
                      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <CourseImage
                          src={courseImage}
                          alt={course.title}
                          title={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Progress Bar Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {/* Difficulty Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm">
                            {course.difficulty_level || 'Beginner'}
                          </span>
                        </div>
                        {/* Duration Badge */}
                        <div className="absolute top-3 right-3">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm flex items-center gap-1">
                            <Clock size={12} />
                            {course.duration_hours || 0}h
                          </span>
                        </div>
                        {/* Progress Percentage Badge */}
                        {progress > 0 && progress < 100 && (
                          <div className="absolute bottom-3 right-3">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500 text-white shadow-lg">
                              {progress}%
                            </span>
                          </div>
                        )}
                        {progress === 100 && (
                          <div className="absolute bottom-3 right-3">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500 text-white shadow-lg flex items-center gap-1">
                              <Trophy size={12} /> Completed
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                            {course.category || 'Professional Development'}
                          </span>
                          {progress === 100 && (
                            <span className="text-xs text-green-600 font-medium">✓ Certified</span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {course.description || 'Start learning today and build your skills'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-600">{progress}%</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
                            <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-blue-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Your Learning Journey</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                  No courses enrolled yet. Browse our catalog and begin your professional development today.
                </p>
                <Link href="/dashboard/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
                  Explore Courses <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
          
          {/* Learning Goals Section */}
          {validEnrollments.length > 0 && progressPercentage < 100 && (
            <div className="mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <Target className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Complete your learning goals</h3>
                    <p className="text-blue-100 text-sm">You're {progressPercentage}% of the way to completing your enrolled courses</p>
                  </div>
                </div>
                <div className="w-48 md:w-64">
                  <div className="flex justify-between text-white text-xs mb-1">
                    <span>Overall Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Admin Quick Link */}
          {isAdmin && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                      <BarChart3 className="text-white" size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Admin Dashboard</h3>
                      <p className="text-sm text-gray-500">Training records, evaluations, and analytics</p>
                    </div>
                  </div>
                  <Link href="/admin/reports" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition shadow-sm">
                    Access Reports <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
