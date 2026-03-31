'use client'

import { Star, Users, Clock, BookOpen, Lock, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'

interface Course {
  id: number
  title: string
  description: string
  category: string
  difficulty: string
  duration: string
  instructor: string
  rating: number
  students: number
  price: number
  isEnrolled: boolean
  progress: number
  slug?: string // Add slug for image mapping
}

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const [isEnrolled, setIsEnrolled] = useState(course.isEnrolled)
  
  // Get image path using course slug or title
  const imagePath = getCourseImage(course.slug || '', course.title)

  const handleEnroll = () => {
    // In a real app, this would make an API call
    setIsEnrolled(true)
    console.log(`Enrolled in course: ${course.title}`)
  }

  const difficultyColor = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  }[course.difficulty] || 'bg-gray-100 text-gray-800'

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Course Image - ADD THIS SECTION */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <CourseImage 
          src={imagePath}
          alt={course.title}
          title={course.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Difficulty Badge Overlay */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${difficultyColor}`}>
            {course.difficulty}
          </span>
        </div>
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-xs font-medium shadow-sm">
            {course.category}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="ml-1 text-sm font-medium">{course.rating}</span>
          </div>
        </div>

        {/* Course Title & Description */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

        {/* Course Stats */}
        <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            <span className="truncate">{course.instructor}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{course.students.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && course.progress > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Your Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            {course.price === 0 ? (
              <span className="text-green-600 font-bold text-lg">FREE</span>
            ) : (
              <span className="text-gray-900 font-bold text-lg">${course.price}</span>
            )}
          </div>
          
          <div>
            {isEnrolled ? (
              <div className="flex items-center space-x-2">
                {course.progress === 100 ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Completed</span>
                  </div>
                ) : (
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
                    Continue Learning
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-md hover:shadow-lg transition-all"
              >
                {course.price > 0 ? (
                  <>
                    <Lock className="h-4 w-4 inline mr-2" />
                    Enroll Now
                  </>
                ) : (
                  'Enroll for Free'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Footer */}
      {isEnrolled && course.progress < 100 && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {course.progress === 0 ? 'Ready to start?' : 'Keep going!'}
            </span>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View Syllabus
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
