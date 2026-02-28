'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CourseGrid from '@/components/courses/CourseGrid'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

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
  category?: string | null
  difficulty?: string | null
  rating?: number | null
  students?: number | null
}

export default function ExplorePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filtered, setFiltered] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .limit(20)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        if (data && isMounted) {
          const mappedCourses = data.map(course => ({
            ...course,
            category: null,
            difficulty: course.level,
            rating: null,
            students: null
          }))
          setCourses(mappedCourses as Course[])
          setFiltered(mappedCourses as Course[])
        } else if (isMounted) {
          setCourses([])
          setFiltered([])
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCourses()

    return () => {
      isMounted = false
    }
  }, [supabase])

  useEffect(() => {
    if (search) {
      setFiltered(courses.filter((c: Course) => 
        c.title.toLowerCase().includes(search.toLowerCase())
      ))
    } else {
      setFiltered(courses)
    }
  }, [search, courses])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Explore Courses</h1>
      
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search courses..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <CourseGrid courses={filtered} loading={loading} />
    </div>
  )
}
