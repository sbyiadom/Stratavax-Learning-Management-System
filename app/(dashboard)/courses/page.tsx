'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CourseGrid from '@/components/courses/CourseGrid'
import CourseFilters from '@/components/courses/CourseFilters'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
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
      
      if (error) throw error
      setCourses(data || [])
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
