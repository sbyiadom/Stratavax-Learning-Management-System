import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import InsightCard from '@/components/InsightCard'
import { 
  BookOpen, Clock, Award, TrendingUp, ChevronRight, 
  FileSpreadsheet, Plus, ExternalLink, ArrowRight,
  BarChart3
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  console.log('User email:', user.email) // Debug log
  
  // Get user's profile with name - using maybeSingle() to avoid errors
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .maybeSingle()
  
  console.log('Profile data:', profile) // Debug log
  console.log('Profile error:', profileError) // Debug log
  
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, course_id, progress_percentage,
      courses:course_id (id, title, slug, duration_hours, category, difficulty_level, thumbnail_url)
    `)
    .eq('user_id', user.id)
  
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
  
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', user.id)
  
  const completedLessons = lessonProgress?.filter(p => p.completed).length || 0
  const totalLessons = lessonProgress?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  // Get user's name - use first_name if available
  const firstName = profile?.first_name || user.email?.split('@')[0] || 'Learner'
  const lastName = profile?.last_name || ''
  const fullName = lastName ? `${firstName} ${lastName}` : firstName
  
  const isAdmin = profile?.role === 'admin'
  const validEnrollments = enrollments?.filter(e => e.courses) || []
  
  // Get greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  
  // Professional quotes
  const quotes = [
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  ]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <DashboardSidebar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Hero Section */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-8 shadow-xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600')] opacity-5 bg-cover bg-center"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-blue-400 rounded-full"></div>
                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{greeting}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                Welcome back, {firstName}
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mb-6">
                Continue your professional development journey
              </p>
              
              {/* Quote Card */}
              <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 max-w-md">
                <div className="flex items-start gap-3">
                  <div className="w-0.5 h-8 bg-blue-400 mt-1"></div>
                  <div>
                    <p className="text-gray-300 text-sm">"{randomQuote.text}"</p>
                    <p className="text-gray-500 text-xs mt-1">— {randomQuote.author}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Interactive Insight Card */}
          <InsightCard />
          
          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition hover:border-green-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition">
                    <FileSpreadsheet className="text-green-600" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Training Registration</h3>
                    <p className="text-sm text-gray-500">Submit training attendance and evaluation</p>
                  </div>
                  <ExternalLink className="text-gray-400 group-hover:text-green-600 transition" size={18} />
                </div>
              </a>
              
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition hover:border-blue-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition">
                    <Plus className="text-blue-600" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">Request a Course</h3>
                    <p className="text-sm text-gray-500">Suggest new training courses</p>
                  </div>
                  <ExternalLink className="text-gray-400 group-hover:text-blue-600 transition" size={18} />
                </div>
              </a>
            </div>
          </div>
          
          {/* Learning Analytics */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Learning Analytics</h2>
              <Link href="/dashboard/progress" className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                View details <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-blue-600" size={18} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{validEnrollments.length}</span>
                </div>
                <p className="text-gray-600 text-sm">Enrolled Courses</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600" size={18} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{progressPercentage}%</span>
                </div>
                <p className="text-gray-600 text-sm">Overall Progress</p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Award className="text-purple-600" size={18} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{certificates?.length || 0}</span>
                </div>
                <p className="text-gray-600 text-sm">Certificates</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Clock className="text-orange-600" size={18} />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{completedLessons}</span>
                </div>
                <p className="text-gray-600 text-sm">Lessons Completed</p>
                <p className="text-xs text-gray-400 mt-1">Out of {totalLessons}</p>
              </div>
            </div>
          </div>
          
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">My Courses</h2>
              <Link href="/dashboard/courses" className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                Browse all <ChevronRight size={14} />
              </Link>
            </div>
            
            {validEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {validEnrollments.map((enrollment: any) => {
                  const progress = enrollment.progress_percentage || 0
                  
                  return (
                    <Link
                      key={enrollment.id}
                      href={`/dashboard/learn/${enrollment.courses.slug}`}
                      className="group bg-white rounded-xl border border-gray-100 hover:shadow-md transition overflow-hidden"
                    >
                      <div className="h-32 bg-gradient-to-r from-gray-700 to-gray-800 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-600">
                          <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="absolute bottom-3 left-4">
                          <span className="text-xs text-white/80">{enrollment.courses.difficulty_level || 'Beginner'}</span>
                        </div>
                        <div className="absolute bottom-3 right-4">
                          <span className="text-xs text-white/80">{enrollment.courses.duration_hours || 0}h</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition">
                          {enrollment.courses.title}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1">
                              <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500">{progress}%</span>
                          </div>
                          <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-600" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-gray-400" size={28} />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No courses enrolled</h3>
                <p className="text-gray-500 text-sm mb-6">Begin your professional development journey</p>
                <Link href="/dashboard/courses" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Browse Courses <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
          
          {/* Admin Quick Link */}
          {isAdmin && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-gray-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Admin Dashboard</h3>
                      <p className="text-sm text-gray-500">Training records, evaluations, and analytics</p>
                    </div>
                  </div>
                  <Link href="/admin/reports" className="text-blue-600 text-sm hover:text-blue-700">
                    Access Reports →
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
