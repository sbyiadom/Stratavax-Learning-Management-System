'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, User, BookOpen } from 'lucide-react'
import CourseImage from '@/components/shared/CourseImage'
import { getCourseImage } from '@/lib/courseImages'

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
  slug?: string | null
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
      {courses.map((course) => {
        // Get image from our mapping or use thumbnail_url if available
        const imagePath = getCourseImage(course.slug || '', course.title) || course.thumbnail_url
        
        return (
          <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
            {/* Image Section - Updated to use CourseImage */}
            <div className="h-48 w-full overflow-hidden bg-gray-100">
              <CourseImage 
                src={imagePath}
                alt={course.title}
                title={course.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            
            <CardHeader>
              <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1">
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {course.description || 'No description available'}
              </p>
              
              <div className="space-y-2">
                {course.instructor && (
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-2" />
                    <span className="truncate">{course.instructor}</span>
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
        )
      })}
    </div>
  )
}
