import Link from 'next/link'
import { GraduationCap, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('/images/landing-bg.jpg')`,
        }}
      />
      
      {/* White Overlay Layer */}
      <div className="absolute inset-0 bg-white/90" />
      
      {/* Content Layer */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Stratavax Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-8">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Welcome to Stratavax</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Stratavax
              </span>
            </h1>
            <h2 className="text-3xl font-semibold text-gray-700 mb-6">
              Learning Management System
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your platform for online learning and course management
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all flex items-center justify-center gap-2 font-medium"
              >
                Sign In
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all font-medium"
              >
                Create Account
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>100+ Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Expert Instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Lifetime Access</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">10k+</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">120+</div>
                <div className="text-sm text-gray-600">Expert Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
