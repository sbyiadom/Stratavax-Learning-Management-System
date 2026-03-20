'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react'

type StudentDetail = {
  id: string
  full_name: string
  email: string
  department: string | null
  role: string | null
  total_points: number
  created_at: string
}

type Enrollment = {
  course_id: string
  course_title: string
  course_slug: string
  progress_percentage: number
  status: string
  completed_at: string | null
  enrolled_at: string
}

type Assignment = {
  id: string
  title: string
  course_title: string
  module_title: string
  status: string
  grade: number | null
  feedback: string | null
  submitted_at: string | null
  graded_at: string | null
  points: number
  difficulty: string
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('courses')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    // Get student profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', params.id)
      .single()

    if (profile) {
      setStudent(profile)
    }

    // Get enrollments with course details
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select(`
        course_id,
        progress_percentage,
        status,
        completed_at,
        enrolled_at,
        courses!inner(title, slug)
      `)
      .eq('user_id', params.id)
      .order('enrolled_at', { ascending: false })

    if (enrollmentsData) {
      const formattedEnrollments = enrollmentsData.map((e: any) => ({
        course_id: e.course_id,
        course_title: e.courses.title,
        course_slug: e.courses.slug,
        progress_percentage: e.progress_percentage,
        status: e.status,
        completed_at: e.completed_at,
        enrolled_at: e.enrolled_at
      }))
      setEnrollments(formattedEnrollments)
    }

    // Get assignments with details
    const { data: assignmentsData } = await supabase
      .from('user_assignments')
      .select(`
        *,
        assignments!inner(
          title,
          points,
          difficulty,
          module_id,
          modules!inner(
            title,
            courses!inner(title)
          )
        )
      `)
      .eq('user_id', params.id)
      .order('submitted_at', { ascending: false })

    if (assignmentsData) {
      const formattedAssignments = assignmentsData.map((a: any) => ({
        id: a.id,
        title: a.assignments.title,
        course_title: a.assignments.modules.courses.title,
        module_title: a.assignments.modules.title,
        status: a.status,
        grade: a.grade,
        feedback: a.feedback,
        submitted_at: a.submitted_at,
        graded_at: a.graded_at,
        points: a.assignments.points,
        difficulty: a.assignments.difficulty
      }))
      setAssignments(formattedAssignments)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Not Found</h1>
          <Link href="/dashboard/instructor/students" className="text-blue-600 hover:underline">
            Back to Students
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    coursesStarted: enrollments.length,
    coursesCompleted: enrollments.filter(e => e.completed_at).length,
    coursesInProgress: enrollments.filter(e => !e.completed_at && e.progress_percentage > 0).length,
    assignmentsSubmitted: assignments.length,
    assignmentsPassed: assignments.filter(a => a.status === 'passed').length,
    assignmentsFailed: assignments.filter(a => a.status === 'failed').length,
    assignmentsPending: assignments.filter(a => a.status === 'submitted').length,
    averageGrade: assignments.filter(a => a.grade).reduce((acc, a) => acc + (a.grade || 0), 0) / assignments.filter(a => a.grade).length || 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <Link
          href="/dashboard/instructor/students"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Students
        </Link>

        {/* Student Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {student.full_name[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
              <p className="text-gray-600">{student.email}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                {student.department && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Briefcase size={16} />
                    {student.department}
                  </span>
                )}
                {student.role && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Award size={16} />
                    {student.role}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={16} />
                  Joined {new Date(student.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{student.total_points}</p>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Courses Started</div>
            <div className="text-2xl font-bold">{stats.coursesStarted}</div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{stats.coursesCompleted} completed</span>
              <span className="text-yellow-600">{stats.coursesInProgress} in progress</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Assignments</div>
            <div className="text-2xl font-bold">{stats.assignmentsSubmitted}</div>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{stats.assignmentsPassed} passed</span>
              <span className="text-yellow-600">{stats.assignmentsPending} pending</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Average Grade</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageGrade ? Math.round(stats.averageGrade) : 0}%
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.assignmentsSubmitted ? Math.round((stats.assignmentsPassed / stats.assignmentsSubmitted) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
                activeTab === 'assignments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Assignments
            </button>
          </nav>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.course_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{enrollment.course_title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-600">{enrollment.progress_percentage}%</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-1.5 bg-blue-600 rounded-full"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.completed_at ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
                      ) : enrollment.progress_percentage > 0 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">In Progress</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Not Started</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/learn/${enrollment.course_slug}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View Course
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-xs text-gray-500">{assignment.module_title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{assignment.course_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'passed' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'failed' ? 'bg-red-100 text-red-700' :
                        assignment.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignment.grade ? (
                        <span className={`font-medium ${
                          assignment.grade >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {assignment.grade}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {assignment.feedback && (
                        <span className="text-sm text-gray-500 cursor-help" title={assignment.feedback}>
                          ℹ️ Feedback
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
