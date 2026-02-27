'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CourseGrid from '@/components/courses/CourseGrid'
import CourseFilters from '@/components/courses/CourseFilters'

// Define the Course type that matches the database
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
  // Optional fields that CourseGrid accepts
  category?: string | null
  difficulty?: string | null
  rating?: number | null
  students?: number | null
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user's enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)

      if (enrollmentsError) throw enrollmentsError

      if (!enrollments || enrollments.length === 0) {
        setCourses([])
        setLoading(false)
        return
      }

      // Get course details for enrolled courses
      const courseIds = enrollments.map(e => e.course_id)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data) {
        // Map the data to include optional fields
        const mappedCourses = data.map(course => ({
          ...course,
          category: null,
          difficulty: course.level,
          rating: null,
          students: null
        }))
        setCourses(mappedCourses as Course[])
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
