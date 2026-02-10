import CourseGrid from '@/components/courses/CourseGrid'
import CourseFilters from '@/components/courses/CourseFilters'

export default function CoursesPage() {
  // Mock data for now
  const mockCourses = [
    {
      id: 1,
      title: 'Web Development Fundamentals',
      description: 'Learn HTML, CSS, and JavaScript from scratch',
      category: 'Web Development',
      difficulty: 'Beginner',
      duration: '40 hours',
      instructor: 'John Smith',
      rating: 4.8,
      students: 1250,
      price: 0,
      isEnrolled: true,
      progress: 85
    },
    {
      id: 2,
      title: 'React Masterclass',
      description: 'Build modern web applications with React',
      category: 'Web Development',
      difficulty: 'Intermediate',
      duration: '60 hours',
      instructor: 'Sarah Johnson',
      rating: 4.9,
      students: 890,
      price: 49.99,
      isEnrolled: true,
      progress: 45
    },
    {
      id: 3,
      title: 'Python for Data Science',
      description: 'Data analysis and visualization with Python',
      category: 'Data Science',
      difficulty: 'Beginner',
      duration: '50 hours',
      instructor: 'Mike Chen',
      rating: 4.7,
      students: 2100,
      price: 0,
      isEnrolled: false,
      progress: 0
    },
    {
      id: 4,
      title: 'UI/UX Design Principles',
      description: 'Design beautiful and user-friendly interfaces',
      category: 'Design',
      difficulty: 'Beginner',
      duration: '35 hours',
      instructor: 'Emma Wilson',
      rating: 4.6,
      students: 1500,
      price: 29.99,
      isEnrolled: false,
      progress: 0
    },
    {
      id: 5,
      title: 'Database Design & SQL',
      description: 'Master database concepts and SQL queries',
      category: 'Database',
      difficulty: 'Intermediate',
      duration: '45 hours',
      instructor: 'David Brown',
      rating: 4.8,
      students: 1100,
      price: 0,
      isEnrolled: true,
      progress: 30
    },
    {
      id: 6,
      title: 'Mobile App Development',
      description: 'Build cross-platform apps with React Native',
      category: 'Mobile',
      difficulty: 'Advanced',
      duration: '70 hours',
      instructor: 'Alex Rodriguez',
      rating: 4.9,
      students: 750,
      price: 79.99,
      isEnrolled: false,
      progress: 0
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-gray-600 mt-2">
            Browse and enroll in available courses
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="search"
            placeholder="Search courses..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Course
          </button>
        </div>
      </div>

      <CourseFilters />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CourseGrid courses={mockCourses} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Learning Paths</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium">Full Stack Developer</h4>
                <p className="text-sm text-gray-600 mt-1">5 courses • 240 hours</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium">Data Scientist</h4>
                <p className="text-sm text-gray-600 mt-1">6 courses • 300 hours</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium">UI/UX Designer</h4>
                <p className="text-sm text-gray-600 mt-1">4 courses • 180 hours</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Top Instructors</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-100"></div>
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-sm text-gray-600">Web Development</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-green-100"></div>
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-gray-600">React Expert</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
