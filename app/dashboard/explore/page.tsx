'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CourseGrid from '@/components/courses/CourseGrid'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

// Approved course slugs from your PDF (the ones with correct videos)
const APPROVED_COURSE_SLUGS = [
  'computer-basics',
  'computer-skills-intermediate',
  'computer-networking-advanced',
  'excel-beginners',
  'excel-data-analysis',
  'excel-advanced',
  'cs50-intro',
  'python-programming',
  'software-engineering',
  'html-css',
  'javascript',
  'full-stack',
  'data-analysis-excel',
  'python-data-analysis',
  'machine-learning',
  'entrepreneurship-intro',
  'business-model-design',
  'business-plan-development',
  'personal-finance',
  'mechanical-engineering',
  'electrical-engineering',
  'plc-programming'
]

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
  slug?: string | null  // Add slug field
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
        // Fetch ONLY approved courses
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .in('slug', APPROVED_COURSE_SLUGS)  // Only get approved courses
          .order('title', { ascending: true })
        
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

      {/* Show count of courses */}
      <p className="text-sm text-gray-500">
        Showing {filtered.length} courses with video content
      </p>

      <CourseGrid courses={filtered} loading={loading} />
    </div>
  )
}
