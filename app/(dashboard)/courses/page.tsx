'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CourseGrid from '@/components/courses/CourseGrid'
import CourseFilters from '@/components/courses/CourseFilters'

// Define the Course type
interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  duration: string | null
  level: string | null
  price: number
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Type assertion
      if (data) {
        setCourses(data as Course[])
      } else {
        setCourses([])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Courses</h1>
      <CourseFilters />
      <CourseGrid courses={courses} loading={loading} />
    </div>
  )
}
