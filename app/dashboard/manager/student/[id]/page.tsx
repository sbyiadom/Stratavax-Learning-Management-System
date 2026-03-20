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
  Briefcase,
  GraduationCap,
  ChevronRight
} from 'lucide-react'

type StudentDetail = {
  student_id: string
  student_name: string
  student_email: string
  department: string | null
  role: string | null
  total_points: number
  courses_started: number
  courses_completed: number
  courses_in_progress: number
  assignments_submitted: number
  assignments_passed: number
  assignments_failed: number
  assignments_pending_review: number
  avg_assignment_grade: number
  last_active: string
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
}

export default function ManagerStudentDetailPage({ params }: { params: { id: string } }) {
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
      .eq('id', params.id)
      .single()

    if (!profile) {
      router.push('/dashboard/manager')
      return
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
      .eq('user_id', profile.user_id)
      .order('enrolled_at', { ascending: false })

    const formattedEnrollments = enrollmentsData?.map((e: any) => ({
      course_id: e.course_id,
      course_title: e.courses.title,
      course_slug: e.courses.slug,
      progress_percentage: e.progress_percentage,
      status: e.status,
      completed_at: e.completed_at,
      enrolled_at: e.enrolled_at
    })) || []

    // Get assignments with details
    const { data: assignmentsData } = await supabase
      .from('user_assignments')
      .select(`
        *,
        assignments!inner(
          title,
          points,
          module_id,
          modules!inner(
            title,
            courses!inner(title)
          )
        )
      `)
      .eq('user_id', profile.user_id)
      .order('submitted_at', { ascending: false })

    const formattedAssignments = assignmentsData?.map((a: any) => ({
      id: a.id,
      title: a.assignments.title,
      course_title: a.assignments.modules.courses.title,
      module_title: a.assignments.modules.title,
      status: a.status,
      grade: a.grade,
      feedback: a.feedback,
      submitted_at: a.submitted_at,
      graded_at: a.graded_at,
      points: a.assignments.points
    })) || []

    // Calculate student stats
    const courses_started = formattedEnrollments.length
    const courses_completed = formattedEnrollments.filter(e => e.completed_at).length
    const courses_in_progress = formattedEnrollments.filter(e => !e.completed_at && e.progress_percentage > 0).length
    
    const assignments_submitted = formattedAssignments.length
    const assignments_passed = formattedAssignments.filter(a => a.status === 'passed').length
    const assignments_failed = formattedAssignments.filter(a => a.status === 'failed').length
    const assignments_pending = formattedAssignments.filter(a => a.status === 'submitted').length
    const avg_grade = formattedAssignments.reduce((acc, a) => acc + (a.grade || 0), 0) / (formattedAssignments.length || 1)

    setStudent({
      student_id: profile.id,
      student_name: profile.full_name,
      student_email: profile.email,
      department: profile.department,
      role: profile.role,
      total_points: profile.total_points || 0,
      courses_started,
      courses_completed,
      courses_in_progress,
      assignments_submitted,
      assignments_passed,
      assignments_failed,
      assignments_pending_review: assignments_pending,
      avg_assignment_grade: avg_grade,
      last_active: new Date().toISOString()
    })

    setEnrollments(formattedEnrollments)
    setAssignments(formattedAssignments)
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
          <Link href="/dashboard/manager" className="text-blue-600 hover:underline">
            Back to Team
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Courses Started', value: student.courses_started, color: 'blue' },
    { label: 'Completed', value: student.courses_completed, color: 'green' },
    { label: 'In Progress', value: student.courses_in_progress, color: 'yellow' },
    { label: 'Assignments', value: student.assignments_submitted, color: 'purple' },
    { label: 'Passed', value: student.assignments_passed, color: 'green' },
    { label: 'Avg Grade', value: `${Math.round(student.avg_assignment_grade)}%`, color: 'orange' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <Link
          href="/dashboard/manager"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Team
        </Link>

        {/* Student Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {student.student_name[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{student.student_name}</h1>
              <p className="text-gray-600">{student.student_email}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                {student.department && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Briefcase size={16} />
                    {student.department}
                  </span>
                )}
                {student.role && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <GraduationCap size={16} />
                    {student.role}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{student.total_points}</p>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
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
