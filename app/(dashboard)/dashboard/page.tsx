import DashboardStats from '@/components/dashboard/StatsCards'
import CourseProgress from '@/components/courses/CourseProgress'

export default function DashboardPage() {
  // Mock data for now - we'll replace with real data later
  const mockStats = {
    totalCourses: 5,
    completedCourses: 2,
    inProgressCourses: 3,
    averageProgress: 65,
    totalStudyTime: 42
  }

  const mockCourses = [
    { id: 1, title: 'Web Development Basics', progress: 85, instructor: 'John Smith' },
    { id: 2, title: 'React Masterclass', progress: 45, instructor: 'Sarah Johnson' },
    { id: 3, title: 'Database Design', progress: 30, instructor: 'Mike Chen' },
    { id: 4, title: 'UI/UX Principles', progress: 100, instructor: 'Emma Wilson' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's your learning progress overview.
        </p>
      </div>

      <DashboardStats stats={mockStats} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Courses</h2>
          <CourseProgress courses={mockCourses} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">React Assignment</h3>
                  <p className="text-sm text-gray-600">Web Development Basics</p>
                </div>
                <span className="text-sm text-red-600 font-medium">Due in 2 days</span>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Database Quiz</h3>
                  <p className="text-sm text-gray-600">Database Design</p>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Due in 5 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-medium">✓</span>
            </div>
            <div>
              <p className="font-medium">Completed "React Components" lesson</p>
              <p className="text-sm text-gray-600">2 hours ago • React Masterclass</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">📝</span>
            </div>
            <div>
              <p className="font-medium">Submitted Database assignment</p>
              <p className="text-sm text-gray-600">Yesterday • Database Design</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
