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
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  Clock
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
  last_active?: string
  courses_count?: number
}

type Student = {
  id: string
  user_id: string
  full_name: string
  email: string
  department: string
  role: string
  has_supervisor: boolean
  enrollment_count?: number
  last_active?: string
}

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned'>('unassigned')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Get all supervisors (users with role = 'supervisor') from profiles_roles
    const { data: supervisorRoles } = await supabase
      .from('profiles_roles')
      .select('user_id')
      .eq('role', 'supervisor')

    if (supervisorRoles && supervisorRoles.length > 0) {
      const supervisorIds = supervisorRoles.map(r => r.user_id)
      
      const { data: supervisorsData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', supervisorIds)
        .order('first_name', { ascending: true }) as any

      if (supervisorsData) {
        // Format supervisor data
        const formattedSupervisors = supervisorsData.map((profile: any) => ({
          id: profile.id,
          user_id: profile.id,
          full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          department: profile.department || '',
          employee_id: '',
          is_active: true,
          created_at: profile.created_at,
          last_active: profile.updated_at
        }))

        // Get student counts for each supervisor
        const supervisorsWithCounts = await Promise.all(
          formattedSupervisors.map(async (sup: any) => {
            const { count } = await supabase
              .from('supervisor_assignments')
              .select('*', { count: 'exact', head: true })
              .eq('supervisor_id', sup.id)
              .eq('is_active', true)

            return {
              ...sup,
              student_count: count || 0,
              courses_count: 0
            }
          })
        )
        setSupervisors(supervisorsWithCounts)
      }
    }

    // Get all students (users with role = 'student') from profiles_roles
    const { data: studentRoles } = await supabase
      .from('profiles_roles')
      .select('user_id')
      .eq('role', 'student')

    if (studentRoles && studentRoles.length > 0) {
      const studentIds = studentRoles.map(r => r.user_id)
      
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)
        .order('first_name', { ascending: true }) as any

      if (studentsData) {
        // Check which students already have supervisors
        const { data: assignments } = await supabase
          .from('supervisor_assignments')
          .select('student_id')
          .eq('is_active', true)

        const assignedStudentIds = new Set(assignments?.map(a => a.student_id) || [])

        // Format student data
        const formattedStudents = studentsData.map((profile: any) => ({
          id: profile.id,
          user_id: profile.id,
          full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          department: profile.department || '',
          role: 'student',
          has_supervisor: assignedStudentIds.has(profile.id),
          enrollment_count: 0,
          last_active: profile.updated_at
        }))

        setStudents(formattedStudents)
      }
    }

    setLoading(false)
  }

  const handleAssignStudents = async () => {
    if (!selectedSupervisor || selectedStudents.length === 0) return

    const assignments = selectedStudents.map(studentId => ({
      supervisor_id: selectedSupervisor.id,
      student_id: studentId,
      is_active: true,
      assigned_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('supervisor_assignments')
      .insert(assignments as any)

    if (!error) {
      setShowAssignModal(false)
      setSelectedStudents([])
      loadData()
    }
  }

  const handleRemoveAssignment = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student assignment?')) return

    const { error } = await supabase
      .from('supervisor_assignments')
      .update({ is_active: false, ended_at: new Date().toISOString() } as any)
      .eq('supervisor_id', selectedSupervisor?.id)
      .eq('student_id', studentId)
      .eq('is_active', true)

    if (!error) {
      loadData()
    }
  }

  // Get assigned students for selected supervisor
  const getAssignedStudents = async (supervisorId: string) => {
    const { data: assignments } = await supabase
      .from('supervisor_assignments')
      .select('student_id')
      .eq('supervisor_id', supervisorId)
      .eq('is_active', true)

    if (!assignments) return []

    const studentIds = assignments.map(a => a.student_id)
    const { data: assignedStudents } = await supabase
      .from('profiles')
      .select('*')
      .in('id', studentIds) as any

    return assignedStudents?.map((profile: any) => ({
      id: profile.id,
      full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      email: profile.email
    })) || []
  }

  const filteredStudents = students.filter(student => 
    (activeTab === 'unassigned' ? !student.has_supervisor : student.has_supervisor) &&
    (student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (student.department && student.department.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('/images/admin-bg.jpg')`
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url('/images/admin-bg.jpg')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stratavax Branding */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supervisor Management</h1>
            <p className="text-sm text-gray-600">Assign students to supervisors for progress monitoring</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{supervisors.length}</p>
                <p className="text-sm text-gray-600">Total Supervisors</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {supervisors.filter(s => s.is_active).length}
                </p>
                <p className="text-sm text-gray-600">Active Supervisors</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.has_supervisor).length}
                </p>
                <p className="text-sm text-gray-600">Assigned Students</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => !s.has_supervisor).length}
                </p>
                <p className="text-sm text-gray-600">Unassigned Students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisors Grid */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Supervisors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {supervisors.map((supervisor) => (
            <div
              key={supervisor.id}
              className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all cursor-pointer ${
                selectedSupervisor?.id === supervisor.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onClick={() => setSelectedSupervisor(supervisor)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {supervisor.full_name?.[0] || 'S'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{supervisor.full_name}</h3>
                  <p className="text-sm text-gray-500">{supervisor.department || 'General'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      supervisor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {supervisor.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {supervisor.student_count} students
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Selected Supervisor Details */}
        {selectedSupervisor && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedSupervisor.full_name?.[0] || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSupervisor.full_name}</h2>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <Mail size={14} /> {selectedSupervisor.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-1 mr-4">
                      <Briefcase size={14} />
                      {selectedSupervisor.department || 'No department'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      {selectedSupervisor.student_count} assigned students
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all flex items-center gap-2"
              >
                <UserPlus size={18} />
                Assign Students
              </button>
            </div>

            {/* Current Assignments */}
            <h3 className="font-semibold text-gray-900 mb-3">Assigned Students</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students
                .filter(s => s.has_supervisor)
                .slice(0, 5)
                .map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {student.full_name?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.full_name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(student.id)}
                      className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove assignment"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
              {students.filter(s => s.has_supervisor).length === 0 && (
                <p className="text-center text-gray-500 py-4">No students assigned yet</p>
              )}
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedSupervisor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assign Students to {selectedSupervisor.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Select students to assign to this supervisor
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAssignModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('unassigned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'unassigned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Unassigned Students ({students.filter(s => !s.has_supervisor).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'assigned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Students ({students.length})
                  </button>
                </div>

                {/* Search */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search students by name, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Student List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                          student.has_supervisor && activeTab !== 'assigned'
                            ? 'border-gray-200 bg-gray-50 opacity-60'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
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
                          disabled={student.has_supervisor && activeTab !== 'assigned'}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{student.full_name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{student.department || 'No department'}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {student.enrollment_count || 0} courses
                              </span>
                            </div>
                          </div>
                          {student.has_supervisor && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              Already assigned
                            </span>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No students found</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedStudents([])
                      setSearchQuery('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignStudents}
                    disabled={selectedStudents.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserPlus size={18} />
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
