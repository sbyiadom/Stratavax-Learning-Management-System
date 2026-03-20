'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, User, BookOpen } from 'lucide-react'

// Define the Course type that CourseGrid expects
interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  duration: string | null
  level: string | null
  price: number
  thumbnail_url: string | null
  category?: string | null
  difficulty?: string | null
  rating?: number | null
  students?: number | null
}

interface CourseGridProps {
  courses: Course[]
  loading?: boolean
}

export default function CourseGrid({ courses, loading }: CourseGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
        <p className="text-gray-500">Try adjusting your filters or check back later.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
          <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
            {course.thumbnail_url ? (
              <img 
                src={course.thumbnail_url} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <BookOpen className="w-12 h-12 text-blue-300" />
              </div>
            )}
          </div>
          
          <CardHeader>
            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1">
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {course.description || 'No description available'}
            </p>
            
            <div className="space-y-2">
              {course.instructor && (
                <div className="flex items-center text-sm text-gray-500">
                  <User className="w-4 h-4 mr-2" />
                  {course.instructor}
                </div>
              )}
              
              {course.duration && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  {course.duration}
                </div>
              )}
              
              {course.level && (
                <div className="flex items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                    course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {course.level}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/courses/${course.id}`}>
                View Course
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
