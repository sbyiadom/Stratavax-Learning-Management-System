'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  Filter,
  GraduationCap,
  ArrowLeft,
  Download,
  Eye,
  Search,
  ChevronDown,
  BarChart,
  Award,
  XCircle,
  BookOpen
} from 'lucide-react'

type UserProfile = {
  full_name: string
  email: string
  department: string | null
}

type Assignment = {
  title: string
  course_id: string
  points: number
  passing_score: number
  courses?: {
    title: string
  }
}

type Submission = {
  id: string
  user_id: string
  assignment_id: string
  status: string
  grade: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  profiles: {
    first_name: string
    last_name: string
    email: string
    department: string | null
  }
  assignments: Assignment
}

type Stats = {
  total: number
  pending: number
  graded: number
  passed: number
  failed: number
  averageScore: number
  completionRate: number
}

export default function AdminAssignmentsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    graded: 0,
    passed: 0,
    failed: 0,
    averageScore: 0,
    completionRate: 0
  })

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('user_assignments')
      .select(`
        *,
        profiles!inner(
          first_name,
          last_name,
          email,
          department
        ),
        assignments!inner(
          title, 
          course_id, 
          points, 
          passing_score,
          courses!inner(title)
        )
      `)
      .order('submitted_at', { ascending: false }) as any

    if (data) {
      // Format the data to include full_name
      const formattedData = data.map((item: any) => ({
        ...item,
        profiles: {
          ...item.profiles,
          full_name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim()
        }
      }))
      
      setSubmissions(formattedData as Submission[])
      
      const pending = data.filter((s: any) => s.status === 'submitted').length
      const graded = data.filter((s: any) => ['passed', 'failed', 'graded'].includes(s.status)).length
      const passed = data.filter((s: any) => s.status === 'passed').length
      const failed = data.filter((s: any) => s.status === 'failed').length
      
      // Calculate average score
      const scores = data
        .filter((s: any) => s.grade !== null)
        .map((s: any) => s.grade as number)
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0

      // Calculate completion rate
      const completionRate = data.length > 0
        ? Math.round((graded / data.length) * 100)
        : 0

      setStats({
        total: data.length,
        pending,
        graded,
        passed,
        failed,
        averageScore,
        completionRate
      })
    }
  }

  const filteredSubmissions = submissions.filter(s => {
    // Apply status filter
    if (filter === 'pending' && s.status !== 'submitted') return false
    if (filter === 'graded' && !['passed', 'failed', 'graded'].includes(s.status)) return false
    if (filter === 'passed' && s.status !== 'passed') return false
    if (filter === 'failed' && s.status !== 'failed') return false
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = s.profiles?.full_name?.toLowerCase() || ''
      const email = s.profiles?.email?.toLowerCase() || ''
      const assignmentTitle = s.assignments?.title?.toLowerCase() || ''
      const courseTitle = s.assignments?.courses?.title?.toLowerCase() || ''
      
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        assignmentTitle.includes(query) ||
        courseTitle.includes(query)
      )
    }
    
    return true
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'passed': return 'bg-green-100 text-green-700 border-green-200'
      case 'failed': return 'bg-red-100 text-red-700 border-red-200'
      case 'graded': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'submitted': return <Clock size={14} className="mr-1" />
      case 'passed': return <CheckCircle size={14} className="mr-1" />
      case 'failed': return <XCircle size={14} className="mr-1" />
      case 'graded': return <Award size={14} className="mr-1" />
      default: return null
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Assignment Submissions</h1>
            <p className="text-sm text-gray-600">Review and grade student assignments</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Graded</p>
                <p className="text-2xl font-bold text-blue-600">{stats.graded}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Passed</p>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg Score</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageScore}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart className="text-purple-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completion</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.completionRate}%</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="text-indigo-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={18} className="text-gray-400" />
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'pending' 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('graded')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'graded' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Graded ({stats.graded})
              </button>
              <button
                onClick={() => setFilter('passed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'passed' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Passed ({stats.passed})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'failed' 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Failed ({stats.failed})
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name, email, or assignment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.map((sub) => {
                  const fullName = sub.profiles?.full_name || 'Unknown'
                  const email = sub.profiles?.email || ''
                  const initial = fullName?.[0] || 'S'
                  
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {initial}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fullName}</p>
                            <p className="text-xs text-gray-500">{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{sub.assignments?.title}</p>
                        <p className="text-xs text-gray-500">Points: {sub.assignments?.points}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          <BookOpen size={12} className="mr-1" />
                          {sub.assignments?.courses?.title || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(sub.submitted_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(sub.status)}`}>
                          {getStatusIcon(sub.status)}
                          {sub.status.replace('_', ' ').charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {sub.grade ? (
                          <div>
                            <span className={`text-sm font-bold ${
                              sub.grade >= (sub.assignments?.passing_score || 70) 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {sub.grade}%
                            </span>
                            <p className="text-xs text-gray-400">
                              /{sub.assignments?.passing_score || 70}% to pass
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not graded</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/assignments/grade/${sub.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {sub.status === 'submitted' ? 'Grade' : 'Review'}
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub)
                              setShowDetailsModal(true)
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery 
                  ? `No results match "${searchQuery}". Try a different search term.`
                  : filter !== 'all' 
                  ? `No ${filter} submissions at the moment.`
                  : 'No assignment submissions have been received yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Submission Details Modal */}
        {showDetailsModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Student Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedSubmission.profiles?.full_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedSubmission.profiles?.full_name}</p>
                      <p className="text-sm text-gray-600">{selectedSubmission.profiles?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedSubmission.profiles?.department || 'No department'}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Assignment Details</h4>
                  <p className="font-medium text-gray-900">{selectedSubmission.assignments?.title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Course: {selectedSubmission.assignments?.courses?.title || 'General'}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-600">Points: {selectedSubmission.assignments?.points}</span>
                    <span className="text-gray-600">Passing Score: {selectedSubmission.assignments?.passing_score || 70}%</span>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Submission Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-600">Submitted:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedSubmission.submitted_at).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                        {getStatusIcon(selectedSubmission.status)}
                        {selectedSubmission.status.replace('_', ' ')}
                      </span>
                    </p>
                    {selectedSubmission.graded_at && (
                      <p className="text-sm">
                        <span className="text-gray-600">Graded:</span>{' '}
                        <span className="font-medium">{new Date(selectedSubmission.graded_at).toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Grade Info */}
                {selectedSubmission.grade !== null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Grade & Feedback</h4>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Grade:</p>
                      <p className={`text-2xl font-bold ${
                        selectedSubmission.grade >= (selectedSubmission.assignments?.passing_score || 70)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {selectedSubmission.grade}%
                      </p>
                    </div>
                    {selectedSubmission.feedback && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Feedback:</p>
                        <p className="text-sm bg-white p-3 rounded-lg border border-gray-200">
                          {selectedSubmission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href={`/admin/assignments/grade/${selectedSubmission.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all"
                  >
                    {selectedSubmission.status === 'submitted' ? 'Grade Assignment' : 'Review Grade'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
