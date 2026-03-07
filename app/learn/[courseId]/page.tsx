'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  FileText, 
  HelpCircle,
  ArrowLeft,
  Award,
  ChevronRight
} from 'lucide-react'

// Course content structure
const courseContent: Record<string, any> = {
  // Basic Computer Literacy
  'basic-computer': {
    id: 'basic-computer',
    title: 'Basic Computer Literacy',
    category: 'Digital & Technology Skills',
    level: 'Beginner',
    duration: '2 weeks',
    totalLessons: 8,
    description: 'Master essential computer skills for the modern workplace.',
    learningObjectives: [
      'Understand computer hardware and software components',
      'Navigate operating systems effectively',
      'Manage files and folders',
      'Use the internet safely and efficiently',
      'Send and receive emails',
      'Protect against common cyber threats',
      'Use basic productivity tools',
      'Troubleshoot common computer issues'
    ],
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Computers',
        description: 'Understanding what computers are and how they work',
        lessons: [
          { id: '1-1', title: 'What is a Computer?', type: 'video', duration: '10 min', completed: false },
          { id: '1-2', title: 'Hardware vs Software', type: 'video', duration: '15 min', completed: false },
          { id: '1-3', title: 'Types of Computers', type: 'reading', duration: '10 min', completed: false },
          { id: '1-4', title: 'Module 1 Quiz', type: 'quiz', duration: '15 min', completed: false },
        ]
      },
      {
        id: 'module-2',
        title: 'Operating Systems',
        description: 'Learning to navigate Windows, macOS, or Linux',
        lessons: [
          { id: '2-1', title: 'What is an Operating System?', type: 'video', duration: '12 min', completed: false },
          { id: '2-2', title: 'Desktop Navigation', type: 'video', duration: '20 min', completed: false },
          { id: '2-3', title: 'File Management', type: 'reading', duration: '15 min', completed: false },
          { id: '2-4', title: 'Installing Software', type: 'video', duration: '18 min', completed: false },
          { id: '2-5', title: 'Module 2 Quiz', type: 'quiz', duration: '20 min', completed: false },
        ]
      },
      {
        id: 'module-3',
        title: 'Internet and Email',
        description: 'Using the web and email safely and effectively',
        lessons: [
          { id: '3-1', title: 'How the Internet Works', type: 'video', duration: '15 min', completed: false },
          { id: '3-2', title: 'Web Browsers and Search', type: 'video', duration: '20 min', completed: false },
          { id: '3-3', title: 'Email Basics', type: 'reading', duration: '12 min', completed: false },
          { id: '3-4', title: 'Internet Safety', type: 'video', duration: '25 min', completed: false },
          { id: '3-5', title: 'Module 3 Quiz', type: 'quiz', duration: '15 min', completed: false },
        ]
      },
      {
        id: 'module-4',
        title: 'Productivity Basics',
        description: 'Introduction to word processing and spreadsheets',
        lessons: [
          { id: '4-1', title: 'Word Processing Introduction', type: 'video', duration: '20 min', completed: false },
          { id: '4-2', title: 'Creating Documents', type: 'reading', duration: '15 min', completed: false },
          { id: '4-3', title: 'Spreadsheet Basics', type: 'video', duration: '22 min', completed: false },
          { id: '4-4', title: 'Module 4 Quiz', type: 'quiz', duration: '15 min', completed: false },
        ]
      },
      {
        id: 'module-5',
        title: 'Final Assessment',
        description: 'Test your computer literacy skills',
        lessons: [
          { id: '5-1', title: 'Practice Exercise', type: 'reading', duration: '30 min', completed: false },
          { id: '5-2', title: 'Final Exam', type: 'quiz', duration: '45 min', completed: false },
        ]
      }
    ],
    prerequisites: ['None'],
    outcomes: [
      'Operate a computer with confidence',
      'Use the internet for research and communication',
      'Create basic documents and spreadsheets',
      'Troubleshoot common computer problems',
      'Practice safe computing habits'
    ]
  }
}

export default function CoursePage() {
  const { courseId } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<any>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Load course content
      const courseData = courseContent[courseId as string]
      if (courseData) {
        setCourse(courseData)
        setExpandedModule(courseData.modules[0]?.id)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [courseId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalLessons = course.modules.reduce((acc: number, mod: any) => acc + mod.lessons.length, 0)
  const completedLessons = course.modules.reduce((acc: number, mod: any) => 
    acc + mod.lessons.filter((l: any) => l.completed).length, 0
  )
  const progress = Math.round((completedLessons / totalLessons) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Overview */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <BookOpen size={16} className="mr-1" />
                      {course.category}
                    </span>
                    <span className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {course.duration}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {course.level}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{progress}%</div>
                  <div className="text-sm text-gray-500">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">About this course</h3>
                <p className="text-gray-600">{course.description}</p>
              </div>

              {/* Learning Objectives */}
              <div>
                <h3 className="font-semibold mb-2">What you'll learn</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {course.learningObjectives.map((obj: string, idx: number) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Course Modules */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Course Content</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {course.modules.length} modules • {totalLessons} lessons
                </p>
              </div>
              <div className="divide-y">
                {course.modules.map((module: any) => (
                  <div key={module.id} className="p-6">
                    <button
                      onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                      className="w-full flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-left">{module.title}</h4>
                        <p className="text-sm text-gray-600 text-left mt-1">{module.description}</p>
                      </div>
                      <ChevronRight 
                        size={20} 
                        className={`text-gray-400 transition-transform ${
                          expandedModule === module.id ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    
                    {expandedModule === module.id && (
                      <div className="mt-4 space-y-2">
                        {module.lessons.map((lesson: any) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            onClick={() => router.push(`/learn/${courseId}/${lesson.id}`)}
                          >
                            <div className="flex items-center space-x-3">
                              {lesson.type === 'video' && <Play size={16} className="text-blue-600" />}
                              {lesson.type === 'reading' && <FileText size={16} className="text-green-600" />}
                              {lesson.type === 'quiz' && <HelpCircle size={16} className="text-purple-600" />}
                              <span className="text-sm font-medium">{lesson.title}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-gray-500">{lesson.duration}</span>
                              {lesson.completed &&
