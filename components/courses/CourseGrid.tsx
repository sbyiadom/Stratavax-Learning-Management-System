import CourseCard from './CourseCard'

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
}

interface CourseGridProps {
  courses: Course[]
}

export default function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
