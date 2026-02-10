import { PlayCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface Course {
  id: number
  title: string
  progress: number
  instructor: string
}

interface CourseProgressProps {
  courses: Course[]
}

export default function CourseProgress({ courses }: CourseProgressProps) {
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{course.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{course.instructor}</p>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center">
              <Link
                href={`/learn/${course.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlayCircle className="h-4 w-4" />
                {course.progress > 0 ? 'Continue' : 'Start'}
              </Link>
            </div>
          </div>
          
          {course.progress === 100 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">
                  🎉 Course Completed!
                </span>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View Certificate
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {courses.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <BookOpen className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">No courses enrolled yet</p>
          <Link
            href="/courses"
            className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  )
}
