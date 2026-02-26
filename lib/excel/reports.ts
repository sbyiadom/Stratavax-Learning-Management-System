import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase-server'  // Fixed import
import { formatDate } from '@/lib/utils'

interface ReportOptions {
  courseId?: string
  userId?: string
  startDate?: Date
  endDate?: Date
}

interface CourseProgressData {
  courseTitle: string
  studentName: string
  studentEmail: string
  enrollmentDate: string
  progress: number
  status: string
  lastAccess: string | null
  completedDate: string | null
}

interface AssessmentData {
  assessmentTitle: string
  studentName: string
  studentEmail: string
  score: number
  passed: boolean
  completedAt: string
  attempts: number
}

export async function generateCourseProgressReport(options: ReportOptions = {}) {
  const supabase = createAdminClient()
  
  try {
    // Build query
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        courses(title),
        profiles!enrollments_user_id_fkey(first_name, last_name, email),
        user_progress(last_accessed_at)
      `)

    if (options.courseId) {
      query = query.eq('course_id', options.courseId)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.startDate) {
      query = query.gte('enrolled_at', options.startDate.toISOString())
    }

    if (options.endDate) {
      query = query.lte('enrolled_at', options.endDate.toISOString())
    }

    const { data: enrollments, error } = await query

    if (error) {
      throw new Error(`Failed to fetch enrollment data: ${error.message}`)
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Course Progress')

    // Add headers
    worksheet.columns = [
      { header: 'Course', key: 'courseTitle', width: 30 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Email', key: 'studentEmail', width: 30 },
      { header: 'Enrolled Date', key: 'enrollmentDate', width: 15 },
      { header: 'Progress (%)', key: 'progress', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Last Access', key: 'lastAccess', width: 15 },
      { header: 'Completed Date', key: 'completedDate', width: 15 }
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data
    enrollments?.forEach((enrollment: any) => {
      const studentName = enrollment.profiles 
        ? `${enrollment.profiles.first_name || ''} ${enrollment.profiles.last_name || ''}`.trim()
        : 'Unknown'
      
      const lastAccess = enrollment.user_progress?.length > 0
        ? formatDate(enrollment.user_progress[0].last_accessed_at)
        : 'Never'

      worksheet.addRow({
        courseTitle: enrollment.courses?.title || 'Unknown Course',
        studentName: studentName || 'Unknown',
        studentEmail: enrollment.profiles?.email || 'No email',
        enrollmentDate: formatDate(enrollment.enrolled_at),
        progress: enrollment.progress_percentage || 0,
        status: enrollment.status || 'in_progress',
        lastAccess,
        completedDate: enrollment.status === 'completed' ? formatDate(enrollment.updated_at) : '-'
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer

  } catch (error) {
    console.error('Error generating course progress report:', error)
    throw error
  }
}

export async function generateAssessmentReport(options: ReportOptions = {}) {
  const supabase = createAdminClient()
  
  try {
    // Build query
    let query = supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes(title),
        profiles!quiz_attempts_user_id_fkey(first_name, last_name, email)
      `)

    if (options.courseId) {
      query = query.eq('course_id', options.courseId)
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.startDate) {
      query = query.gte('completed_at', options.startDate.toISOString())
    }

    if (options.endDate) {
      query = query.lte('completed_at', options.endDate.toISOString())
    }

    const { data: attempts, error } = await query

    if (error) {
      throw new Error(`Failed to fetch assessment data: ${error.message}`)
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Assessment Results')

    // Add headers
    worksheet.columns = [
      { header: 'Assessment', key: 'assessmentTitle', width: 30 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Email', key: 'studentEmail', width: 30 },
      { header: 'Score (%)', key: 'score', width: 12 },
      { header: 'Passed', key: 'passed', width: 10 },
      { header: 'Completed Date', key: 'completedAt', width: 15 },
      { header: 'Attempts', key: 'attempts', width: 10 }
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data
    attempts?.forEach((attempt: any) => {
      const studentName = attempt.profiles 
        ? `${attempt.profiles.first_name || ''} ${attempt.profiles.last_name || ''}`.trim()
        : 'Unknown'

      worksheet.addRow({
        assessmentTitle: attempt.quizzes?.title || 'Unknown Assessment',
        studentName: studentName || 'Unknown',
        studentEmail: attempt.profiles?.email || 'No email',
        score: attempt.score || 0,
        passed: attempt.passed ? 'Yes' : 'No',
        completedAt: formatDate(attempt.completed_at),
        attempts: 1 // You might want to count actual attempts
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer

  } catch (error) {
    console.error('Error generating assessment report:', error)
    throw error
  }
}

export async function generateComprehensiveReport(options: ReportOptions = {}) {
  const supabase = createAdminClient()
  
  try {
    const workbook = new ExcelJS.Workbook()
    
    // Add course progress sheet
    const courseProgressSheet = workbook.addWorksheet('Course Progress')
    await generateCourseProgressSheet(courseProgressSheet, supabase, options)
    
    // Add assessment sheet
    const assessmentSheet = workbook.addWorksheet('Assessment Results')
    await generateAssessmentSheet(assessmentSheet, supabase, options)
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    await generateSummarySheet(summarySheet, supabase, options)

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer

  } catch (error) {
    console.error('Error generating comprehensive report:', error)
    throw error
  }
}

// Helper functions for comprehensive report
async function generateCourseProgressSheet(sheet: ExcelJS.Worksheet, supabase: any, options: ReportOptions) {
  // Similar to generateCourseProgressReport but writes to existing sheet
  // Implementation here...
}

async function generateAssessmentSheet(sheet: ExcelJS.Worksheet, supabase: any, options: ReportOptions) {
  // Similar to generateAssessmentReport but writes to existing sheet
  // Implementation here...
}

async function generateSummarySheet(sheet: ExcelJS.Worksheet, supabase: any, options: ReportOptions) {
  // Generate summary statistics
  // Implementation here...
}
