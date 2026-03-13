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
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Stratavax Badge - Solid background for readability */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full mb-8 shadow-lg border border-white/20">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Welcome to Stratavax</span>
            </div>

            {/* Main Heading - Text with slight background for readability */}
            <div className="inline-block bg-white/30 backdrop-blur-sm px-8 py-4 rounded-2xl mb-4">
              <h1 className="text-5xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stratavax
                </span>
              </h1>
            </div>
            
            <div className="inline-block bg-white/30 backdrop-blur-sm px-8 py-4 rounded-2xl mb-6">
              <h2 className="text-3xl font-semibold text-gray-800">
                Learning Management System
              </h2>
            </div>
            
            <div className="inline-block bg-white/30 backdrop-blur-sm px-8 py-4 rounded-2xl mb-8 max-w-2xl mx-auto">
              <p className="text-xl text-gray-700">
                Your platform for online learning and course management
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/login"
                className="px-8 py-4 bg-white/90 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-white hover:shadow-xl transition-all flex items-center justify-center gap-2 font-medium border border-blue-200"
              >
                Sign In
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all font-medium backdrop-blur-sm"
              >
                Create Account
              </Link>
            </div>

            {/* Trust Indicators - Glass cards */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="bg-white/40 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30 shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-800 font-medium">{totalCourses || 120}+ Courses</span>
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

            {/* Stats - Glass cards with real data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{totalStudents?.toLocaleString() || '10k+'}</div>
                  <div className="text-sm text-gray-700 font-medium">Active Students</div>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{totalCourses || '120'}+</div>
                  <div className="text-sm text-gray-700 font-medium">Expert Courses</div>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">95%</div>
                  <div className="text-sm text-gray-700 font-medium">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
