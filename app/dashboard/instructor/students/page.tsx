'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  Download,
  BarChart3,
  TrendingUp,
  Award
} from 'lucide-react'

type StudentProgress = {
  student_id: string
  full_name: string
  email: string
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
  avg_assignment_grade: number | null
  last_active: string
}

export default function InstructorStudentsPage() {
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalAssignments: 0,
    avgGrade: 0
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('student_progress_summary')
      .select('*')
      .order('total_points', { ascending: false })

    if (data) {
      setStudents(data)
      setFilteredStudents(data)

      // Extract unique departments
      const depts = Array.from(new Set(data.map(s => s.department).filter(Boolean))) as string[]
      setDepartments(depts)

      // Calculate stats
      const totalAssignments = data.reduce((acc, s) => acc + s.assignments_submitted, 0)
      const avgGrade = data.reduce((acc, s) => acc + (s.avg_assignment_grade || 0), 0) / data.length
      const activeStudents = data.filter(s => {
        const lastActive = new Date(s.last_active)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return lastActive > thirtyDaysAgo
      }).length

      setStats({
        totalStudents: data.length,
        activeStudents,
        totalAssignments,
        avgGrade: Math.round(avgGrade)
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    let filtered = students

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(s => s.department === departmentFilter)
    }

    setFilteredStudents(filtered)
  }, [searchQuery, departmentFilter, students])

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'passed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'submitted': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Performance Dashboard</h1>
          <p className="text-gray-600">Track progress, assignments, and engagement</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active (30d)</p>
                <p className="text-2xl font-bold">{stats.activeStudents}</p>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assignments</p>
                <p className="text-2xl font-bold">{stats.totalAssignments}</p>
              </div>
              <BookOpen className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Grade</p>
                <p className="text-2xl font-bold">{stats.avgGrade}%</p>
              </div>
              <Award className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.department || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 font-medium">{student.courses_completed}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{student.courses_started}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-1.5 bg-green-600 rounded-full"
                          style={{ width: `${student.courses_started ? (student.courses_completed/student.courses_started)*100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">{student.assignments_passed}</span>
                      <span className="text-yellow-600">{student.assignments_pending_review}</span>
                      <span className="text-red-600">{student.assignments_failed}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">{student.assignments_submitted}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      (student.avg_assignment_grade || 0) >= 70 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {student.avg_assignment_grade ? Math.round(student.avg_assignment_grade) : 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-blue-600">{student.total_points}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(student.last_active).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/instructor/students/${student.student_id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
