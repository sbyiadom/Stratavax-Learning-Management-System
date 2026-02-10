'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  PlayCircle, 
  BookOpen, 
  Clock, 
  Users, 
  BarChart3,
  FileText,
  MessageSquare,
  ChevronRight,
  Star,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

// Mock course data - in real app, fetch from API
const mockCourse = {
  id: 1,
  title: 'React Masterclass',
  description: 'Learn React from basics to advanced concepts including hooks, context, Redux, and modern best practices.',
  instructor: {
    name: 'Sarah Johnson',
    title: 'Senior Frontend Engineer',
    rating: 4.9,
    students: 15000
  },
  category: 'Web Development',
  difficulty: 'Intermediate',
  duration: '60 hours',
  totalLessons: 42,
  enrolledStudents: 890,
  rating: 4.9,
  price: 49.99,
  isEnrolled: true,
  progress: 45,
  syllabus: [
    { id: 1, title: 'Introduction to React', duration: '2h 30m', completed: true },
    { id: 2, title: 'JSX and Components', duration: '3h 15m', completed: true },
    { id: 3, title: 'State and Props', duration: '4h', completed: true },
    { id: 4, title: 'React Hooks', duration: '5h 30m', completed: false },
    { id: 5, title: 'Context API', duration: '4h', completed: false },
    { id: 6, title: 'React Router', duration: '3h 45m', completed: false },
    { id: 7, title: 'Redux Toolkit', duration: '6h', completed: false },
    { id: 8, title: 'Testing React Apps', duration: '4h 30m', completed: false },
  ],
  resources: [
    { type: 'pdf', title: 'Course Syllabus', size: '2.4 MB' },
    { type: 'zip', title: 'Starter Files', size: '15.7 MB' },
    { type: 'link', title: 'React Documentation', url: 'https://reactjs.org' },
  ]
}

export default function CourseLearnPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState('syllabus')

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {mockCourse.category}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {mockCourse.difficulty}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{mockCourse.title}</h1>
            <p className="text-blue-100 mb-6 max-w-3xl">{mockCourse.description}</p>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{mockCourse.duration}</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>{mockCourse.totalLessons} lessons</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>{mockCourse.enrolledStudents.toLocaleString()} students</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2 fill-current" />
                <span>{mockCourse.rating} rating</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[300px]">
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-100">Your Progress</span>
                <span className="font-semibold">{mockCourse.progress}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full"
                  style={{ width: `${mockCourse.progress}%` }}
                ></div>
              </div>
            </div>
            
            <button className="w-full py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 mb-3 flex items-center justify-center">
              <PlayCircle className="h-5 w-5 mr-2" />
              Continue Learning
            </button>
            
            <div className="text-center text-sm text-blue-200">
              Last accessed: 2 days ago
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-8">
        <nav className="flex space-x-8">
          {['syllabus', 'resources', 'discussions', 'instructor'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'syllabus' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
              <div className="space-y-4">
                {mockCourse.syllabus.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            lesson.completed ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {lesson.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <span className="text-blue-600 font-semibold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{lesson.duration}</span>
                            {lesson.completed && (
                              <span className="ml-3 flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href={`/learn/${params.courseId}/lesson/${lesson.id}`}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {lesson.completed ? 'Review' : 'Start'}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Course Resources</h2>
              <div className="space-y-4">
                {mockCourse.resources.map((resource, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <h3 className="font-medium">{resource.title}</h3>
                          {'size' in resource && (
                            <p className="text-sm text-gray-500">{resource.size}</p>
                          )}
                        </div>
                      </div>
                      {'url' in resource ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Open Link
                        </a>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Instructor Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Instructor</h3>
            <div className="flex items-start space-x-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-blue-100"></div>
              <div>
                <h4 className="font-semibold">{mockCourse.instructor.name}</h4>
                <p className="text-sm text-gray-600">{mockCourse.instructor.title}</p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="ml-1 text-sm font-medium">{mockCourse.instructor.rating}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-600">
                    {mockCourse.instructor.students.toLocaleString()} students
                  </span>
                </div>
              </div>
            </div>
            <button className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
              View Profile
            </button>
          </div>

          {/* Course Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Course Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Time to Complete</span>
                <span className="font-semibold">45 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Certificate Rate</span>
                <span className="font-semibold">92%</span>
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Upcoming</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">Live Q&A Session</div>
                <div className="text-xs text-yellow-600 mt-1">Tomorrow, 2:00 PM EST</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Assignment Due</div>
                <div className="text-xs text-blue-600 mt-1">In 3 days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
