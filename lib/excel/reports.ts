import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface ReportOptions {
  title: string
  includeTimestamps?: boolean
  includeSummary?: boolean
}

export async function generateCourseReport(courseId: string, options: ReportOptions = {}) {
  const supabase = createAdminClient()
  
  // Fetch course data
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  // Fetch enrollments with user info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      profiles:user_id (
        email,
        first_name,
        last_name
      )
    `)
    .eq('course_id', courseId)
  
  // Fetch assessments for this course
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      *,
      lessons!inner (
        id,
        title,
        module:modules (
          course_id
        )
      )
    `)
    .eq('lessons.modules.course_id', courseId)
  
  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Stratavax LMS'
  workbook.created = new Date()
  workbook.modified = new Date()

  // 1. Course Overview Sheet
  const overviewSheet = workbook.addWorksheet('Course Overview')
  
  overviewSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 40 },
  ]

  overviewSheet.getRow(1).font = { bold: true, size: 12 }
  overviewSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  overviewSheet.addRow({ metric: 'Course Title', value: course?.title })
  overviewSheet.addRow({ metric: 'Description', value: course?.description })
  overviewSheet.addRow({ metric: 'Instructor', value: course?.instructor || 'N/A' })
  overviewSheet.addRow({ metric: 'Duration', value: course?.duration || 'N/A' })
  overviewSheet.addRow({ metric: 'Level', value: course?.level || 'N/A' })
  overviewSheet.addRow({ metric: 'Total Enrollments', value: enrollments?.length || 0 })
  overviewSheet.addRow({ 
    metric: 'Average Progress', 
    value: enrollments?.length 
      ? `${Math.round(
          (enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) || 0) / 
          enrollments.length
        )}%`
      : '0%'
  })
  overviewSheet.addRow({ 
    metric: 'Completion Rate', 
    value: enrollments?.length 
      ? `${Math.round(
          (enrollments?.filter(e => e.status === 'completed').length || 0) / 
          enrollments.length * 100
        )}%`
      : '0%'
  })
  overviewSheet.addRow({ metric: 'Created Date', value: formatDate(course?.created_at) })
  if (options.includeTimestamps) {
    overviewSheet.addRow({ metric: 'Report Generated', value: formatDate(new Date().toISOString()) })
  }

  // 2. Student Progress Sheet
  const progressSheet = workbook.addWorksheet('Student Progress')
  
  progressSheet.columns = [
    { header: 'Student Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Enrollment Date', key: 'enrolled_at', width: 20 },
    { header: 'Progress (%)', key: 'progress', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Last Active', key: 'updated_at', width: 20 },
  ]

  progressSheet.getRow(1).font = { bold: true }
  progressSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  enrollments?.forEach(enrollment => {
    const profile = enrollment.profiles || {}
    progressSheet.addRow({
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A',
      email: profile.email || 'N/A',
      enrolled_at: formatDate(enrollment.enrolled_at),
      progress: enrollment.progress_percentage || 0,
      status: enrollment.status === 'active' ? 'In Progress' : 
              enrollment.status === 'completed' ? 'Completed' : 'Cancelled',
      updated_at: formatDate(enrollment.updated_at),
    })
  })

  // 3. Assessment Results Sheet
  if (assessments && assessments.length > 0) {
    const assessmentSheet = workbook.addWorksheet('Assessment Results')
    
    assessmentSheet.columns = [
      { header: 'Student', key: 'student', width: 30 },
      { header: 'Lesson', key: 'lesson', width: 40 },
      { header: 'Score', key: 'score', width: 15 },
      { header: 'Max Score', key: 'max_score', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
      { header: 'Submitted At', key: 'submitted_at', width: 20 },
    ]

    assessmentSheet.getRow(1).font = { bold: true }
    assessmentSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Group assessments by user
    const userAssessments = assessments.reduce((acc: any, assessment: any) => {
      const key = `${assessment.user_id}-${assessment.lesson_id}`
      if (!acc[key]) {
        acc[key] = {
          user_id: assessment.user_id,
          lesson_title: assessment.lessons?.title || 'Unknown',
          score: assessment.score || 0,
          max_score: assessment.max_score || 0,
          submitted_at: assessment.submitted_at,
        }
      }
      return acc
    }, {})

    Object.values(userAssessments).forEach((assessment: any) => {
      assessmentSheet.addRow({
        student: assessment.user_id, // In production, join with profiles
        lesson: assessment.lesson_title,
        score: assessment.score,
        max_score: assessment.max_score,
        percentage: assessment.max_score > 0 
          ? `${Math.round((assessment.score / assessment.max_score) * 100)}%`
          : 'N/A',
        submitted_at: formatDate(assessment.submitted_at),
      })
    })
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function generateUserProgressReport(userId: string) {
  const supabase = createAdminClient()
  
  // Fetch user's enrollments with course details
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses (*)
    `)
    .eq('user_id', userId)
  
  // Fetch user's assessments
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      *,
      lessons (
        title,
        module:modules (
          course_id
        )
      )
    `)
    .eq('user_id', userId)
  
  const workbook = new ExcelJS.Workbook()
  
  // Progress Report Sheet
  const sheet = workbook.addWorksheet('My Progress')
  
  sheet.columns = [
    { header: 'Course', key: 'course', width: 40 },
    { header: 'Enrolled', key: 'enrolled', width: 15 },
    { header: 'Progress', key: 'progress', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Assessments', key: 'assessments', width: 15 },
    { header: 'Avg. Score', key: 'avg_score', width: 15 },
  ]

  sheet.getRow(1).font = { bold: true }
  
  enrollments?.forEach(enrollment => {
    const courseAssessments = assessments?.filter(
      a => a.lessons?.module?.course_id === enrollment.course_id
    ) || []
    
    const avgScore = courseAssessments.length > 0
      ? Math.round(courseAssessments.reduce((acc, a) => acc + (a.score || 0), 0) / courseAssessments.length)
      : 0
    
    sheet.addRow({
      course: enrollment.courses?.title || 'Unknown',
      enrolled: new Date(enrollment.enrolled_at).toLocaleDateString(),
      progress: `${enrollment.progress_percentage || 0}%`,
      status: enrollment.status,
      assessments: courseAssessments.length,
      avg_score: `${avgScore}%`,
    })
  })
  
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
