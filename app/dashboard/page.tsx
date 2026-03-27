import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { BookOpen, Clock, Award, TrendingUp, ChevronRight, FileSpreadsheet, Plus, ExternalLink } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .maybeSingle()
  
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, course_id, progress_percentage,
      courses:course_id (id, title, slug, duration_hours, category, difficulty_level)
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
  
  const firstName = profile?.first_name || user.email?.split('@')[0] || 'Learner'
  const isAdmin = profile?.role === 'admin'
  const validEnrollments = enrollments?.filter(e => e.courses) || []
  
  return (
    <>
      <Navigation user={user} isAdmin={isAdmin} />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}</h1>
            <p className="text-gray-600 mt-1">Continue your learning journey where you left off</p>
          </div>
          
          {/* Quick Actions Cards */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfyGkgfb5PQM_7O8XwJ0d9mfqj2t9w4ryJDMpFf2zD5R1lmNw/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100 hover:border-green-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition">
                    <FileSpreadsheet className="text-green-600" size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Training Registration</h3>
                    <p className="text-sm text-gray-500">Submit your training attendance and evaluation</p>
                  </div>
                  <ExternalLink className="text-gray-400 group-hover:text-green-600" size={20} />
                </div>
              </a>
              
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSeCifdHaoX89Cn8THhaBEai3MLrY_Ln7JKnH-tzXwai8LKLkg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                    <Plus className="text-blue-600" size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Request a Course</h3>
                    <p className="text-sm text-gray-500">Suggest a new training course to be added</p>
                  </div>
                  <ExternalLink className="text-gray-400 group-hover:text-blue-600" size={20} />
                </div>
              </a>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl"><BookOpen className="text-blue-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{validEnrollments.length}</p><p className="text-sm text-gray-500">Enrolled Courses</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl"><TrendingUp className="text-green-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{progressPercentage}%</p><p className="text-sm text-gray-500">Overall Progress</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl"><Award className="text-purple-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{certificates?.length || 0}</p><p className="text-sm text-gray-500">Certificates</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl"><Clock className="text-orange-600" size={24} /></div>
                <div><p className="text-2xl font-bold">{completedLessons}</p><p className="text-sm text-gray-500">Lessons Completed</p></div>
              </div>
            </div>
          </div>
          
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Courses</h2>
              <Link href="/dashboard/courses" className="text-blue-600 text-sm flex items-center gap-1">Browse All Courses <ChevronRight size={16} /></Link>
            </div>
            {validEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {validEnrollments.map((enrollment: any) => (
                  <Link key={enrollment.id} href={`/dashboard/learn/${enrollment.courses.slug}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div className="h-full bg-green-500" style={{ width: `${enrollment.progress_percentage || 0}%` }} />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{enrollment.courses.title}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-blue-600">{enrollment.progress_percentage || 0}% Complete</span>
                        <span className="text-xs text-gray-400">{enrollment.courses.duration_hours || 0}h</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 mb-6">Start your learning journey by enrolling in a course</p>
                <Link href="/dashboard/courses" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Browse Courses <ChevronRight size={18} className="ml-2" /></Link>
              </div>
            )}
          </div>
          
          {/* Admin Quick Link */}
          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div><h3 className="font-semibold text-gray-900">Admin Dashboard</h3><p className="text-sm text-gray-600">View all training records, evaluations, and analytics</p></div>
                  <Link href="/admin/reports" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">Go to Admin Reports <ChevronRight size={16} className="ml-1" /></Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
