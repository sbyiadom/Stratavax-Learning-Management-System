import Link from 'next/link'
import { GraduationCap, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Stratavax Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-8">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Welcome to Stratavax</span>
          </div>

          {/* Main Heading with Stratavax */}
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
          
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
            >
              Create Account
            </Link>
          </div>

          {/* Trust Indicator */}
          <div className="mt-12 text-sm text-gray-500">
            <p>Join thousands of learners already on Stratavax</p>
          </div>
        </div>
      </div>
    </div>
  )
}
