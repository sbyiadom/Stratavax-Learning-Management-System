import Link from 'next/link'
import { GraduationCap, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Get real stats
  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'learner')

  const courseCount = totalCourses || 17
  const studentCount = totalStudents || 10000

  return (
    <div className="min-h-screen relative">
      {/* Background Image - Fully visible */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('/images/landing-bg.jpg')`,
        }}
      />
      
      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            {/* Welcome Badge - Centered */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full shadow-lg border border-white/20">
                <Sparkles size={16} />
                <span className="text-sm font-medium">Welcome to Stratavax</span>
              </div>
            </div>

            {/* Main Title - Standalone at top */}
            <div className="text-center mb-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stratavax
                </span>
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
                Learning Management System
              </h2>
            </div>

            {/* Description */}
            <div className="text-center mb-10">
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
                Your platform for online learning and course management
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/login"
                className="px-8 py-4 bg-white/90 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-white hover:shadow-xl transition-all flex items-center justify-center gap-2 font-medium border border-blue-200 min-w-[200px]"
              >
                Sign In
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all font-medium min-w-[200px] text-center"
              >
                Create Account
              </Link>
            </div>

            {/* Trust Indicators - Centered in one row */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <div className="bg-white/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-800 font-medium">{courseCount}+ Courses</span>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-800 font-medium">Expert Instructors</span>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-800 font-medium">Lifetime Access</span>
                </div>
              </div>
            </div>

            {/* Stats - Three cards in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl text-center">
                <div className="text-3xl font-bold text-gray-900">{studentCount >= 10000 ? '10k+' : studentCount.toLocaleString()}</div>
                <div className="text-sm text-gray-700 font-medium">Active Students</div>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl text-center">
                <div className="text-3xl font-bold text-gray-900">{courseCount}+</div>
                <div className="text-sm text-gray-700 font-medium">Expert Courses</div>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl text-center">
                <div className="text-3xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-700 font-medium">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Developed by XSTRATEGICS */}
        <footer className="py-6 text-center">
          <div className="bg-white/30 backdrop-blur-sm inline-block px-6 py-2 rounded-full border border-white/40 shadow-lg">
            <p className="text-sm text-gray-700">
              Developed by{' '}
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                XSTRATEGICS
              </span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
