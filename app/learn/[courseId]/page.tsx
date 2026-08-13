'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, BarChart, ChevronRight, GraduationCap, Sparkles } from 'lucide-react'

// Complete course catalog with all courses
const courseCategories = [
  // ============================================================
  // LEADERSHIP & MANAGEMENT
  // ============================================================
  {
    id: 'leadership',
    name: 'Leadership & Management',
    icon: '👔',
    description: 'Build leadership capability and management skills',
    courses: [
      { id: 'effective-leadership-talent-management', title: 'Effective Leadership & Talent Management', level: 'Intermediate', duration: '40 hours', lessons: 8, enrolled: 0 },
      { id: 'power-influence-leadership', title: 'Power & Influence in Leadership', level: 'Intermediate', duration: '25 hours', lessons: 4, enrolled: 0 },
      { id: 'leading-inclusive-workforce', title: 'Leading an Inclusive Workforce', level: 'Intermediate', duration: '25 hours', lessons: 5, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // PERSONAL DEVELOPMENT
  // ============================================================
  {
    id: 'personal-development',
    name: 'Personal Development',
    icon: '🧠',
    description: 'Develop emotional intelligence, communication, and resilience',
    courses: [
      { id: 'personality-transformations', title: 'Personality & Its Transformations', level: 'Advanced', duration: '50 hours', lessons: 4, enrolled: 0 },
      { id: 'assertive-communication-eq', title: 'Assertive Communication & EQ', level: 'Beginner', duration: '15 hours', lessons: 6, enrolled: 0 },
      { id: 'mental-reset-wellness', title: 'Mental Reset & Wellness Strategies', level: 'Beginner', duration: '10 hours', lessons: 4, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // PROGRAMMING
  // ============================================================
  {
    id: 'programming',
    name: 'Programming & Computer Science',
    icon: '💻',
    description: 'Learn to code with Harvard CS50 courses',
    courses: [
      { id: 'cs50-web-programming', title: 'CS50 Web Programming with Python & JavaScript', level: 'Intermediate', duration: '60 hours', lessons: 6, enrolled: 0 },
      { id: 'cs50-computer-science', title: 'CS50 Introduction to Computer Science', level: 'Beginner', duration: '50 hours', lessons: 6, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // DIGITAL & TECHNOLOGY SKILLS
  // ============================================================
  {
    id: 'digital',
    name: 'Digital & Technology Skills',
    icon: '💻',
    description: 'Prepare for the modern digital economy',
    courses: [
      { id: 'basic-computer', title: 'Basic Computer Literacy', level: 'Beginner', duration: '2 weeks', lessons: 8, enrolled: 0 },
      { id: 'microsoft-office', title: 'Microsoft Office (Word, Excel, PowerPoint)', level: 'Beginner', duration: '4 weeks', lessons: 15, enrolled: 0 },
      { id: 'excel-analysis', title: 'Data Analysis with Excel', level: 'Intermediate', duration: '3 weeks', lessons: 10, enrolled: 0 },
      { id: 'python-intro', title: 'Introduction to Programming (Python)', level: 'Beginner', duration: '6 weeks', lessons: 20, enrolled: 0 },
      { id: 'javascript-intro', title: 'Introduction to Programming (JavaScript)', level: 'Beginner', duration: '6 weeks', lessons: 20, enrolled: 0 },
      { id: 'web-dev', title: 'Web Development (HTML, CSS, JavaScript)', level: 'Intermediate', duration: '8 weeks', lessons: 30, enrolled: 0 },
      { id: 'cybersecurity', title: 'Cybersecurity Basics', level: 'Beginner', duration: '4 weeks', lessons: 12, enrolled: 0 },
      { id: 'ai-fundamentals', title: 'Artificial Intelligence Fundamentals', level: 'Intermediate', duration: '5 weeks', lessons: 18, enrolled: 0 },
      { id: 'data-science', title: 'Data Science Basics', level: 'Intermediate', duration: '6 weeks', lessons: 22, enrolled: 0 },
      { id: 'cloud-computing', title: 'Cloud Computing Fundamentals', level: 'Intermediate', duration: '4 weeks', lessons: 14, enrolled: 0 },
      { id: 'ui-ux', title: 'Digital Product Design (UI/UX)', level: 'Intermediate', duration: '5 weeks', lessons: 16, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // ENTREPRENEURSHIP & BUSINESS
  // ============================================================
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship & Business Skills',
    icon: '🚀',
    description: 'Start and grow successful businesses',
    courses: [
      { id: 'entrepreneurship-intro', title: 'Introduction to Entrepreneurship', level: 'Beginner', duration: '3 weeks', lessons: 10, enrolled: 0 },
      { id: 'business-model', title: 'Business Model Development', level: 'Intermediate', duration: '4 weeks', lessons: 12, enrolled: 0 },
      { id: 'business-plan', title: 'Business Plan Writing', level: 'Intermediate', duration: '3 weeks', lessons: 9, enrolled: 0 },
      { id: 'financial-literacy', title: 'Financial Literacy', level: 'Beginner', duration: '4 weeks', lessons: 14, enrolled: 0 },
      { id: 'accounting', title: 'Accounting for Small Businesses', level: 'Intermediate', duration: '5 weeks', lessons: 18, enrolled: 0 },
      { id: 'marketing', title: 'Marketing & Branding', level: 'Beginner', duration: '4 weeks', lessons: 15, enrolled: 0 },
      { id: 'sales', title: 'Sales Skills', level: 'Beginner', duration: '3 weeks', lessons: 11, enrolled: 0 },
      { id: 'ecommerce', title: 'E-commerce Business', level: 'Intermediate', duration: '5 weeks', lessons: 16, enrolled: 0 },
      { id: 'crm', title: 'Customer Relationship Management', level: 'Intermediate', duration: '3 weeks', lessons: 10, enrolled: 0 },
      { id: 'negotiation', title: 'Business Negotiation', level: 'Advanced', duration: '3 weeks', lessons: 9, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // CAREER DEVELOPMENT
  // ============================================================
  {
    id: 'career',
    name: 'Career Development & Employability',
    icon: '📈',
    description: 'Get jobs and advance your career',
    courses: [
      { id: 'cv-writing', title: 'CV / Resume Writing', level: 'Beginner', duration: '1 week', lessons: 5, enrolled: 0 },
      { id: 'interview-prep', title: 'Job Interview Preparation', level: 'Beginner', duration: '2 weeks', lessons: 7, enrolled: 0 },
      { id: 'workplace-etiquette', title: 'Workplace Etiquette', level: 'Beginner', duration: '1 week', lessons: 4, enrolled: 0 },
      { id: 'professional-communication', title: 'Professional Communication', level: 'Beginner', duration: '2 weeks', lessons: 8, enrolled: 0 },
      { id: 'networking', title: 'Networking for Career Growth', level: 'Intermediate', duration: '2 weeks', lessons: 6, enrolled: 0 },
      { id: 'remote-work', title: 'Remote Work Skills', level: 'Beginner', duration: '2 weeks', lessons: 7, enrolled: 0 },
      { id: 'freelancing', title: 'Freelancing Fundamentals', level: 'Intermediate', duration: '3 weeks', lessons: 10, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // ENGINEERING
  // ============================================================
  {
    id: 'engineering',
    name: 'Engineering & Technical Skills',
    icon: '⚙️',
    description: 'Technical skills for industrial and engineering careers',
    courses: [
      { id: 'mechanical-concepts', title: 'Basic Mechanical Engineering Concepts', level: 'Beginner', duration: '5 weeks', lessons: 18, enrolled: 0 },
      { id: 'electrical-systems', title: 'Electrical Systems Basics', level: 'Beginner', duration: '4 weeks', lessons: 15, enrolled: 0 },
      { id: 'industrial-automation', title: 'Industrial Automation Basics', level: 'Intermediate', duration: '6 weeks', lessons: 20, enrolled: 0 },
      { id: 'plc-programming', title: 'PLC Programming', level: 'Advanced', duration: '8 weeks', lessons: 25, enrolled: 0 },
      { id: 'maintenance-planning', title: 'Maintenance Planning', level: 'Intermediate', duration: '4 weeks', lessons: 14, enrolled: 0 },
      { id: 'preventive-maintenance', title: 'Preventive Maintenance', level: 'Intermediate', duration: '4 weeks', lessons: 13, enrolled: 0 },
      { id: 'reliability-engineering', title: 'Reliability Engineering', level: 'Advanced', duration: '6 weeks', lessons: 22, enrolled: 0 },
      { id: 'manufacturing', title: 'Manufacturing Processes', level: 'Intermediate', duration: '5 weeks', lessons: 17, enrolled: 0 },
      { id: 'lean-manufacturing', title: 'Lean Manufacturing', level: 'Intermediate', duration: '4 weeks', lessons: 15, enrolled: 0 },
      { id: 'six-sigma', title: 'Quality Control & Six Sigma', level: 'Advanced', duration: '6 weeks', lessons: 20, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // FINANCE
  // ============================================================
  {
    id: 'finance',
    name: 'Financial & Investment Literacy',
    icon: '💰',
    description: 'Manage money and build wealth',
    courses: [
      { id: 'personal-finance', title: 'Personal Finance Management', level: 'Beginner', duration: '3 weeks', lessons: 11, enrolled: 0 },
      { id: 'budgeting', title: 'Budgeting and Saving', level: 'Beginner', duration: '2 weeks', lessons: 8, enrolled: 0 },
      { id: 'investing-basics', title: 'Investing Basics', level: 'Beginner', duration: '3 weeks', lessons: 10, enrolled: 0 },
      { id: 'stock-market', title: 'Stock Market Fundamentals', level: 'Intermediate', duration: '4 weeks', lessons: 14, enrolled: 0 },
      { id: 'cryptocurrency', title: 'Cryptocurrency Basics', level: 'Intermediate', duration: '3 weeks', lessons: 9, enrolled: 0 },
      { id: 'risk-management', title: 'Risk Management', level: 'Advanced', duration: '4 weeks', lessons: 13, enrolled: 0 },
      { id: 'retirement', title: 'Retirement Planning', level: 'Intermediate', duration: '3 weeks', lessons: 10, enrolled: 0 },
      { id: 'loans-credit', title: 'Understanding Loans and Credit', level: 'Beginner', duration: '2 weeks', lessons: 7, enrolled: 0 },
    ]
  },
  
  // ============================================================
  // FUTURE SKILLS
  // ============================================================
  {
    id: 'future-skills',
    name: 'Digital Economy & Future Skills',
    icon: '🔮',
    description: 'Skills for future job markets',
    courses: [
      { id: 'ai-business', title: 'Artificial Intelligence in Business', level: 'Intermediate', duration: '4 weeks', lessons: 14, enrolled: 0 },
      { id: 'automation', title: 'Automation & Robotics Overview', level: 'Beginner', duration: '3 weeks', lessons: 10, enrolled: 0 },
      { id: 'blockchain', title: 'Blockchain Technology', level: 'Intermediate', duration: '4 weeks', lessons: 13, enrolled: 0 },
      { id: 'digital-marketing', title: 'Digital Marketing', level: 'Beginner', duration: '5 weeks', lessons: 18, enrolled: 0 },
      { id: 'content-creation', title: 'Content Creation', level: 'Beginner', duration: '4 weeks', lessons: 14, enrolled: 0 },
      { id: 'social-media', title: 'Social Media Management', level: 'Intermediate', duration: '4 weeks', lessons: 15, enrolled: 0 },
      { id: 'online-business', title: 'Online Business', level: 'Intermediate', duration: '5 weeks', lessons: 16, enrolled: 0 },
    ]
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load enrolled courses from localStorage
        const saved = localStorage.getItem(`enrolled_${user.id}`)
        if (saved) {
          setEnrolledCourses(JSON.parse(saved))
        }
      }
      
      setLoading(false)
    }
    
    getUser()
  }, [supabase])

  const handleEnroll = (courseId: string) => {
    if (!enrolledCourses.includes(courseId)) {
      const updated = [...enrolledCourses, courseId]
      setEnrolledCourses(updated)
      if (user) {
        localStorage.setItem(`enrolled_${user.id}`, JSON.stringify(updated))
      }
      router.push(`/dashboard/learn/${courseId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Flatten all courses for filtering
  const allCourses = courseCategories.flatMap(cat => 
    cat.courses.map(course => ({ ...course, category: cat.name, categoryId: cat.id }))
  )

  const filteredCourses = selectedCategory === 'all' 
    ? allCourses 
    : allCourses.filter(course => course.categoryId === selectedCategory)

  const enrolledList = allCourses.filter(course => enrolledCourses.includes(course.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white" size={18} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Stratavax</h1>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Beta
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.email?.split('@')[0] || 'Learner'}!</h2>
          <p className="text-blue-100 mb-4">
            You have access to {allCourses.length}+ free courses to develop your skills.
          </p>
          <div className="flex space-x-4">
            <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
              {enrolledCourses.length} courses enrolled
            </span>
            <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
              {allCourses.length} total courses
            </span>
          </div>
        </div>

        {/* Enrolled Courses Section */}
        {enrolledList.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BookOpen className="mr-2" size={24} />
              My Learning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledList.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="h-2 bg-green-500"></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        In Progress
                      </span>
                      <span className="text-xs text-gray-500">{course.level}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.category}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {course.duration}
                      </span>
                      <span className="flex items-center">
                        <BookOpen size={14} className="mr-1" />
                        {course.lessons} lessons
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/learn/${course.id}`)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      Continue Learning
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Browse Courses</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Categories
            </button>
            {courseCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.includes(course.id)
            
            return (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className={`h-2 ${isEnrolled ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      isEnrolled 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-blue-600 bg-blue-50'
                    }`}>
                      {isEnrolled ? 'Enrolled' : course.level}
                    </span>
                    <span className="text-xs text-gray-500">{course.duration}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.category}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <BookOpen size={14} className="mr-1" />
                    {course.lessons} lessons
                  </div>
                  
                  {isEnrolled ? (
                    <button
                      onClick={() => router.push(`/dashboard/learn/${course.id}`)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      Continue Learning
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-blue-600">{allCourses.length}+</div>
            <div className="text-sm text-gray-600">Free Courses</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-green-600">{courseCategories.length}</div>
            <div className="text-sm text-gray-600">Skill Categories</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-purple-600">{enrolledCourses.length}</div>
            <div className="text-sm text-gray-600">Your Courses</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-orange-600">Certificates</div>
            <div className="text-sm text-gray-600">Earn on Completion</div>
          </div>
        </div>
      </main>
    </div>
  )
}
