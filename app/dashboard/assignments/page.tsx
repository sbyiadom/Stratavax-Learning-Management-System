'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Award,
  BookOpen,
  Filter,
  Search,
  Calendar,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-react'

// Define types based on your actual database schema
type Course = {
  id: string
  title: string
  slug: string
  difficulty_level: string
  category: string
}

type Module = {
  title: string
}

type Assignment = {
  id: string
  course_id: string
  module_id: string
  title: string
  description: string
  instructions: string
  difficulty: string
  points: number
  due_days: number
  is_required: boolean
  created_at: string
  courses?: Course | Course[] | null
  modules?: Module | Module[] | null
}

type UserAssignment = {
  id: string
  user_id: string
  assignment_id: string
  status: string
  submission_url: string | null
  submission_text: string | null
  grade: number | null
  feedback: string | null
  submitted_at: string | null
  graded_at: string | null
  created_at: string
}

type AssignmentWithProgress = Assignment & {
  user_assignment?: UserAssignment | null
}

interface CourseGroup {
  courseId: string
  courseTitle: string
  courseSlug: string
  courseDifficulty: string
  courseCategory: string
  assignments: AssignmentWithProgress[]
}

export default function AssignmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithProgress[]>([])
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([])
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithProgress | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submissionText, setSubmissionText] = useState('')
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (!user) {
      router.push('/login')
      return
    }

    try {
      // Get all assignments with course info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          courses (
            id,
            title,
            slug,
            difficulty_level,
            category
          ),
          modules (
            title
          )
        `)
        .order('due_days', { ascending: true }) as any

      if (assignmentsError) {
        console.error('Error loading assignments:', assignmentsError)
        return
      }

      if (assignmentsData) {
        // Get user's progress on these assignments
        const { data: userAssignments, error: userAssignmentsError } = await supabase
          .from('user_assignments')
          .select('*')
          .eq('user_id', user.id) as any

        if (userAssignmentsError) {
          console.error('Error loading user assignments:', userAssignmentsError)
        }

        // Merge assignment data with user progress
        const assignmentsWithProgress = assignmentsData.map((assignment: any) => ({
          ...assignment,
          user_assignment: userAssignments?.find((ua: any) => ua.assignment_id === assignment.id) || null
        }))

        setAssignments(assignmentsWithProgress)
        
        // Group by course
        const groups = new Map<string, CourseGroup>()
        assignmentsWithProgress.forEach((assignment: any) => {
          const course = assignment.courses as Course | null
          if (!course) return
          
          if (!groups.has(course.id)) {
            groups.set(course.id, {
              courseId: course.id,
              courseTitle: course.title,
              courseSlug: course.slug,
              courseDifficulty: course.difficulty_level || 'Beginner',
              courseCategory: course.category || 'Course',
              assignments: []
            })
          }
          groups.get(course.id)!.assignments.push(assignment)
        })
        
        setCourseGroups(Array.from(groups.values()))
        
        // Auto-expand courses with pending assignments
        const pendingCourseIds = new Set<string>()
        assignmentsWithProgress.forEach((assignment: any) => {
          const status = assignment.user_assignment?.status || 'not_started'
          if (status === 'not_started' || status === 'in_progress') {
            if (assignment.courses?.id) {
              pendingCourseIds.add(assignment.courses.id)
            }
          }
        })
        setExpandedCourses(pendingCourseIds)
        setFilteredAssignments(assignmentsWithProgress)
      }
    } catch (error) {
      console.error('Error in loadAssignments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = assignments

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => {
        const status = a.user_assignment?.status || 'not_started'
        if (filter === 'pending') return status === 'not_started' || status === 'in_progress'
        if (filter === 'submitted') return status === 'submitted'
        if (filter === 'graded') return status === 'graded' || status === 'passed' || status === 'failed'
        if (filter === 'completed') return status === 'passed'
        return true
      })
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(a => {
        const courseTitle = a.courses && typeof a.courses === 'object' && 'title' in a.courses 
          ? (a.courses as Course).title 
          : ''
        
        return a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

    setFilteredAssignments(filtered)
  }, [filter, searchQuery, assignments])

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'not_started': return 'bg-gray-100 text-gray-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'submitted': return 'bg-yellow-100 text-yellow-700'
      case 'graded': return 'bg-purple-100 text-purple-700'
      case 'passed': return 'bg-green-100 text-green-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'not_started': return 'Not Started'
      case 'in_progress': return 'In Progress'
      case 'submitted': return 'Awaiting Review'
      case 'graded': return 'Graded'
      case 'passed': return 'Passed'
      case 'failed': return 'Failed'
      default: return 'Not Started'
    }
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment || !user) return

    setSubmitting(true)

    let submissionUrl = ''
    
    // Upload file if provided
    if (submissionFile) {
      try {
        const fileExt = submissionFile.name.split('.').pop()
        const fileName = `${user.id}/${selectedAssignment.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(fileName, submissionFile)

        if (uploadError) {
          alert('Error uploading file: ' + uploadError.message)
          setSubmitting(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(fileName)

        submissionUrl = publicUrl
      } catch (error) {
        console.error('Upload error:', error)
        alert('Error uploading file')
        setSubmitting(false)
        return
      }
    }

    try {
      // Save submission
      const { error } = await supabase
        .from('user_assignments')
        .upsert({
          user_id: user.id,
          assignment_id: selectedAssignment.id,
          status: 'submitted',
          submission_text: submissionText,
          submission_url: submissionUrl,
          submitted_at: new Date().toISOString()
        } as any)

      if (!error) {
        setShowSubmitModal(false)
        setSubmissionText('')
        setSubmissionFile(null)
        loadAssignments()
      } else {
        console.error('Submission error:', error)
        alert('Error submitting assignment')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Error submitting assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCourseTitle = (courses: Course | Course[] | null | undefined): string => {
    if (!courses) return ''
    if (Array.isArray(courses)) {
      return courses[0]?.title || ''
    }
    return courses.title || ''
  }

  // Calculate statistics
  const totalAssignments = assignments.length
  const completedAssignments = assignments.filter(a => a.user_assignment?.status === 'passed').length
  const pendingAssignments = assignments.filter(a => {
    const status = a.user_assignment?.status || 'not_started'
    return status === 'not_started' || status === 'in_progress'
  }).length
  const averageScore = assignments.filter(a => a.user_assignment?.grade !== null)
    .reduce((acc, a) => acc + (a.user_assignment?.grade || 0), 0) / 
    (assignments.filter(a => a.user_assignment?.grade !== null).length || 1)

  // Group filtered assignments for display
  const filteredGroups = courseGroups.map(group => ({
    ...group,
    assignments: group.assignments.filter(a => filteredAssignments.some(fa => fa.id === a.id))
  })).filter(group => group.assignments.length > 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-2">Track and complete your course assignments</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
              <FileText size={28} className="text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedAssignments}</p>
              </div>
              <CheckCircle size={28} className="text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAssignments}</p>
              </div>
              <Clock size={28} className="text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Score</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(averageScore)}%</p>
              </div>
              <Award size={28} className="text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assignments by title or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Assignments</option>
            <option value="pending">Pending</option>
            <option value="submitted">Awaiting Review</option>
            <option value="graded">Graded</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Course Groups */}
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((course) => {
              const isExpanded = expandedCourses.has(course.courseId)
              const pendingInCourse = course.assignments.filter(a => {
                const status = a.user_assignment?.status || 'not_started'
                return status === 'not_started' || status === 'in_progress'
              }).length
              const completedInCourse = course.assignments.filter(a => a.user_assignment?.status === 'passed').length
              const progressPercentage = course.assignments.length > 0 
                ? (completedInCourse / course.assignments.length) * 100 
                : 0

              return (
                <div key={course.courseId} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  {/* Course Header */}
                  <button
                    onClick={() => toggleCourse(course.courseId)}
                    className="w-full text-left p-5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen size={20} className="text-blue-500" />
                          <h2 className="text-lg font-semibold text-gray-900">{course.courseTitle}</h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(course.courseDifficulty)}`}>
                            {course.courseDifficulty}
                          </span>
                          <span className="text-xs text-gray-500">{course.courseCategory}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {course.assignments.length} assignments
                          </span>
                          {pendingInCourse > 0 && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <Clock size={14} />
                              {pendingInCourse} pending
                            </span>
                          )}
                          {completedInCourse > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={14} />
                              {completedInCourse} completed
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Course Progress</span>
                            <span>{Math.round(progressPercentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </button>

                  {/* Assignments List */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100 border-t">
                      {course.assignments.map((assignment) => {
                        const status = assignment.user_assignment?.status || 'not_started'
                        const statusColor = getStatusColor(status)
                        const statusLabel = getStatusLabel(status)
                        const dueDate = new Date()
                        dueDate.setDate(dueDate.getDate() + assignment.due_days)
                        const isOverdue = dueDate < new Date() && status !== 'passed'

                        return (
                          <div key={assignment.id} className="p-5 hover:bg-gray-50 transition">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(assignment.difficulty)}`}>
                                    {assignment.difficulty}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                  {assignment.is_required && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Award size={12} />
                                    {assignment.points} points
                                  </span>
                                  <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                                    <Calendar size={12} />
                                    Due in {assignment.due_days} days
                                    {isOverdue && <span className="text-red-600 ml-1">(Overdue)</span>}
                                  </span>
                                  {assignment.user_assignment?.grade !== null && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle size={12} />
                                      Score: {assignment.user_assignment?.grade}/{assignment.points}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                {status === 'passed' ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">Completed</span>
                                  </div>
                                ) : status === 'submitted' ? (
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    <Clock size={16} />
                                    <span className="text-sm font-medium">Awaiting Review</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedAssignment(assignment)
                                      setShowSubmitModal(true)
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    {status === 'in_progress' ? 'Continue' : 'Start Assignment'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Submit Assignment</h2>
                <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedAssignment.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedAssignment.description}</p>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {selectedAssignment.instructions}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer / Submission Text
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your answer here..."
                    required={!submissionFile}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, Word, Excel, Images, ZIP
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
