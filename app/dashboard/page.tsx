import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import InsightCard from '@/components/InsightCard'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'
import { 
  BookOpen, Clock, Award, TrendingUp, ChevronRight, 
  FileSpreadsheet, Plus, ExternalLink, ArrowRight,
  BarChart3, Target, Sparkles, PlayCircle,
  Trophy, CheckCircle2, Activity, Zap
} from 'lucide-react'

type Course = {
  id: string
  title: string
  slug: string
  duration_hours: number | null
  category: string | null
  difficulty_level: string | null
  thumbnail_url: string | null
  description: string | null
}

type Enrollment = {
  id: string
  course_id: string
  progress_percentage: number
  enrolled_at: string
  status: string
  courses: Course | null
}

type Profile = {
  first_name: string | null
  last_name: string | null
  role: string | null
  avatar_url: string | null
}

type Certificate = {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

type Progress = {
  lesson_id: string
  completed: boolean
  updated_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, avatar_url')
    .eq('id', user.id)
    .maybeSingle() as { data: Profile | null, error: any }
  
  const { data: enrollmentsData } = await supabase
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
  
  const enrollments = enrollmentsData as unknown as Enrollment[] | null
  
  const { data: certificatesData } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
  
  const certificates = certificatesData as Certificate[] | null
  
  const { data: lessonProgressData } = await supabase
    .from('progress')
    .select('completed, lesson_id')
    .eq('user_id', user.id)
  
  const lessonProgress = lessonProgressData as Progress[] | null
  
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
  const avgProgress = enrollments && enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0
  
  const completedCourses = enrollments?.filter(e => e.progress_percentage === 100).length || 0
  
  const firstName = profile?.first_name || user.email?.split('@')[0] || 'Learner'
  const lastName = profile?.last_name || ''
  const isAdmin = profile?.role === 'admin'
  const validEnrollments = enrollments?.filter(e => e.courses) || []
  
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  
  const firstEnrollment = validEnrollments[0]?.enrolled_at
  const daysSinceStart = firstEnrollment 
    ? Math.floor((new Date().getTime() - new Date(firstEnrollment).getTime()) / (1000 * 3600 * 24))
    : 0
  
  const quotes = [
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi", icon: "🌟" },
    { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan", icon: "📚" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King", icon: "💡" },
  ]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
  
  const { data: recentProgressData } = await supabase
    .from('progress')
    .select('lesson_id, updated_at, completed')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)
  
  const recentProgress = recentProgressData as Progress[] | null
  const firstEnrolledCourse = validEnrollments[0]?.courses

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <DashboardSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Section */}
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600')] opacity-10 bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-transparent to-slate-900/90"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl">{greeting === 'Good morning' ? '🌅' : greeting === 'Good afternoon' ? '☀️' : '🌙'}</span>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs font-medium">Welcome back</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{firstName} {lastName}</h1>
                  </div>
                </div>
                {daysSinceStart > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-white text-xs font-medium">{daysSinceStart} Day Streak</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-gray-300 text-sm mb-3">Continue your professional development journey</p>
                  <div className="flex flex-wrap gap-2">
                    {firstEnrolledCourse && firstEnrolledCourse.slug && (
                      <Link href={`/dashboard/learn/${firstEnrolledCourse.slug}`} className="inline-flex items-center gap-1 px-4 py-1.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-blue-50 transition shadow-lg">
                        <PlayCircle size={14} /> Continue Learning
                      </Link>
                    )}
                    <Link href="/dashboard/courses" className="inline-flex items-center gap-1 px-4 py-1.5 bg-transparent border border-white/30 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition">
                      <BookOpen size={14} /> Browse Courses
                    </Link>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{randomQuote.icon}</span>
                    <div>
                      <p className="text-gray-200 text-xs italic">"{randomQuote.text}"</p>
                      <p className="text-gray-400 text-[10px] mt-1">— {randomQuote.author}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><BookOpen className="text-blue-600" size={14} /></div>
                <span className="text-xl font-bold text-gray-800">{validEnrollments.length}</span>
              </div>
              <p className="text-xs text-gray-600">Active Courses</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><TrendingUp className="text-green-600" size={14} /></div>
                <span className="text-xl font-bold text-gray-800">{avgProgress}%</span>
              </div>
              <p className="text-xs text-gray-600">Avg. Progress</p>
              <div className="mt-1 w-full bg-gray-100 rounded-full h-1"><div className="bg-green-500 h-1 rounded-full" style={{ width: `${avgProgress}%` }}></div></div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Award className="text-purple-600" size={14} /></div>
                <span className="text-xl font-bold text-gray-800">{certificates?.length || 0}</span>
              </div>
              <p className="text-xs text-gray-600">Certificates</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center"><CheckCircle2 className="text-orange-600" size={14} /></div>
                <span className="text-xl font-bold text-gray-800">{completedLessons}</span>
              </div>
              <p className="text-xs text-gray-600">Lessons Done</p>
              <p className="text-[10px] text-gray-400">of {totalLessons}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center"><Trophy className="text-indigo-600" size={14} /></div>
                <span className="text-xl font-bold text-gray-800">{completedCourses}</span>
              </div>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </div>
          
          <InsightCard />
          
          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-1"><Sparkles className="w-4 h-4 text-blue-600" /> Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform" target="_blank" rel="noopener noreferrer" className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"><FileSpreadsheet className="text-white" size={18} /></div>
                  <div className="flex-1"><h3 className="font-semibold text-gray-800 text-sm">Training Registration</h3><p className="text-xs text-gray-500">Submit training attendance</p></div>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              </a>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform" target="_blank" rel="noopener noreferrer" className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"><Plus className="text-white" size={18} /></div>
                  <div className="flex-1"><h3 className="font-semibold text-gray-800 text-sm">Request a Course</h3><p className="text-xs text-gray-500">Suggest new training</p></div>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              </a>
            </div>
          </div>
          
          {/* Recent Activity */}
          {recentProgress && recentProgress.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold text-gray-800 flex items-center gap-1"><Activity className="w-4 h-4 text-blue-600" /> Recent Activity</h2><Link href="/dashboard/progress" className="text-blue-600 text-xs">View all</Link></div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {recentProgress.map((progress, idx) => (
                  <div key={progress.lesson_id} className={`flex items-center gap-3 p-3 ${idx !== recentProgress.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">{progress.completed ? <CheckCircle2 className="text-green-500" size={14} /> : <BookOpen className="text-blue-500" size={14} />}</div>
                    <div className="flex-1"><p className="text-xs font-medium text-gray-800">{progress.completed ? 'Completed a lesson' : 'Started a lesson'}</p><p className="text-[10px] text-gray-400">{new Date(progress.updated_at).toLocaleDateString()}</p></div>
                    <ArrowRight size={12} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold text-gray-800 flex items-center gap-1"><BookOpen className="w-4 h-4 text-blue-600" /> My Learning Journey</h2><Link href="/dashboard/courses" className="text-blue-600 text-xs">Browse all</Link></div>
            {validEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {validEnrollments.map((enrollment) => {
                  const progress = enrollment.progress_percentage || 0
                  const course = enrollment.courses
                  if (!course) return null
                  const courseImage = getCourseImage(course.slug, course.title)
                  return (
                    <Link key={enrollment.id} href={`/dashboard/learn/${course.slug}`} className="group bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
                      <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                        <CourseImage src={courseImage} alt={course.title} title={course.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${progress}%` }} /></div>
                        <div className="absolute top-2 left-2"><span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/70 text-white">{course.difficulty_level || 'Beginner'}</span></div>
                        <div className="absolute top-2 right-2"><span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/70 text-white flex items-center gap-0.5"><Clock size={8} />{course.duration_hours || 0}h</span></div>
                        {progress > 0 && progress < 100 && <div className="absolute bottom-2 right-2"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">{progress}%</span></div>}
                      </div>
                      <div className="p-3"><h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1 group-hover:text-blue-600">{course.title}</h3><p className="text-[10px] text-gray-500 mb-2">{course.category || 'Professional Development'}</p>
                        <div className="flex items-center justify-between"><div className="flex-1 mr-2"><div className="flex items-center gap-1"><div className="flex-1 bg-gray-100 rounded-full h-1"><div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full" style={{ width: `${progress}%` }} /></div><span className="text-[10px] font-semibold text-gray-600">{progress}%</span></div></div><ArrowRight size={12} className="text-blue-600" /></div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center border border-gray-200"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2"><BookOpen className="text-blue-500" size={20} /></div><h3 className="text-sm font-semibold text-gray-800 mb-1">Start Your Learning Journey</h3><p className="text-xs text-gray-500 mb-3">No courses enrolled yet.</p><Link href="/dashboard/courses" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">Explore Courses</Link></div>
            )}
          </div>
          
          {/* Admin Quick Link */}
          {isAdmin && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200"><div className="flex items-center justify-between flex-wrap gap-2"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center"><BarChart3 className="text-white" size={14} /></div><div><h3 className="font-medium text-gray-800 text-sm">Admin Dashboard</h3><p className="text-xs text-gray-500">Training records & analytics</p></div></div><Link href="/admin/reports" className="text-blue-600 text-xs font-medium">Access Reports →</Link></div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
