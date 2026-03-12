'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  ArrowLeft,
  Briefcase,
  Mail,
  User
} from 'lucide-react'

type Supervisor = {
  id: string
  user_id: string
  full_name: string
  email: string
  department: string
  employee_id: string
  is_active: boolean
  created_at: string
  student_count?: number
}

type Student = {
  id: string
  user_id: string
  full_name: string
  email: string
  department: string
  role: string
  has_supervisor: boolean
}

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Get all supervisors (users with role = 'supervisor')
    const { data: supervisorsData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'supervisor')
      .order('full_name')

    if (supervisorsData) {
      // Get student counts for each supervisor
      const supervisorsWithCounts = await Promise.all(
        supervisorsData.map(async (sup) => {
          const { count } = await supabase
            .from('supervisor_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('supervisor_id', sup.id)
            .eq('is_active', true)

          return {
            ...sup,
            student_count: count || 0
          }
        })
      )
      setSupervisors(supervisorsWithCounts)
    }

    // Get all students (users with role = 'student')
    const { data: studentsData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name')

    if (studentsData) {
      // Check which students already have supervisors
      const { data: assignments } = await supabase
        .from('supervisor_assignments')
        .select('student_id')
        .eq('is_active', true)

      const assignedStudentIds = new Set(assignments?.map(a => a.student_id) || [])

      const studentsWithStatus = studentsData.map(student => ({
        ...student,
        has_supervisor: assignedStudentIds.has(student.id)
      }))

      setStudents(studentsWithStatus)
    }

    setLoading(false)
  }

  const handleAssignStudents = async () => {
    if (!selectedSupervisor || selectedStudents.length === 0) return

    const assignments = selectedStudents.map(studentId => ({
      supervisor_id: selectedSupervisor.id,
      student_id: studentId,
      is_active: true
    }))

    const { error } = await supabase
      .from('supervisor_assignments')
      .insert(assignments)

    if (!error) {
      setShowAssignModal(false)
      setSelectedStudents([])
      loadData()
    }
  }

  const handleRemoveAssignment = async (studentId: string) => {
    const { error } = await supabase
      .from('supervisor_assignments')
      .update({ is_active: false })
      .eq('supervisor_id', selectedSupervisor?.id)
      .eq('student_id', studentId)

    if (!error) {
      loadData()
    }
  }

  const filteredStudents = students.filter(student => 
    !student.has_supervisor &&
    (student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (student.department && student.department.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Management</h1>
          <p className="text-gray-600">Assign students to supervisors for progress monitoring</p>
        </div>

        {/* Supervisors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {supervisors.map((supervisor) => (
            <div
              key={supervisor.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedSupervisor(supervisor)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {supervisor.full_name[0]}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{supervisor.full_name}</h3>
                  <p className="text-sm text-gray-500">{supervisor.department}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Students: {supervisor.student_count}</span>
                <span className="text-blue-600">View Details →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Supervisor Details */}
        {selectedSupervisor && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSupervisor.full_name}</h2>
                <p className="text-gray-600">{selectedSupervisor.email}</p>
                <p className="text-sm text-gray-500 mt-1">Department: {selectedSupervisor.department}</p>
                <p className="text-sm text-gray-500">Employee ID: {selectedSupervisor.employee_id}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={18} />
                Assign Students
              </button>
            </div>

            {/* Current Assignments */}
            <h3 className="font-semibold text-gray-900 mb-3">Assigned Students</h3>
            <div className="space-y-2">
              {students
                .filter(s => {
                  // This would need to be replaced with actual assignments query
                  return false // Placeholder - you'll need to fetch actual assignments
                })
                .map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gray-400" />
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(student.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedSupervisor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Assign Students to {selectedSupervisor.full_name}
                  </h3>
                  <button onClick={() => setShowAssignModal(false)}>
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Search */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Student List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id])
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignStudents}
                    disabled={selectedStudents.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Assign Selected ({selectedStudents.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
