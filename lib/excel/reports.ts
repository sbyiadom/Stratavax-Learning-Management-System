import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'

interface ReportOptions {
  startDate?: Date
  endDate?: Date
  courseId?: string
  userId?: string
}

export class ReportGenerator {
  private supabase
  
  constructor() {
    // Initialize admin client for report generation (bypasses RLS)
    this.supabase = createAdminClient()
  }

  async generateCourseProgressReport(options: ReportOptions = {}) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Course Progress')

    // Add headers
    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 30 },
      { header: 'User Email', key: 'email', width: 30 },
      { header: 'Course ID', key: 'courseId', width: 30 },
      { header: 'Course Title', key: 'courseTitle', width: 40 },
      { header: 'Progress (%)', key: 'progress', width: 15 },
      { header: 'Enrolled Date', key: 'enrolledAt', width: 20 },
      { header: 'Last Activity', key: 'lastActivity', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    // Style headers
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Fetch data from Supabase
    let query = this.supabase
      .from('enrollments')
      .select(`
        *,
        users:user_id (email),
        courses:course_id (title)
      `)

    if (options.startDate) {
      query = query.gte('enrolled_at', options.startDate.toISOString())
    }
    if (options.endDate) {
      query = query.lte('enrolled_at', options.endDate.toISOString())
    }
    if (options.courseId) {
      query = query.eq('course_id', options.courseId)
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data: enrollments, error } = await query

    if (error) {
      throw new Error(`Failed to fetch enrollment data: ${error.message}`)
    }

    // Add data rows
    enrollments?.forEach((enrollment: any) => {
      worksheet.addRow({
        userId: enrollment.user_id,
        email: enrollment.users?.email || 'N/A',
        courseId: enrollment.course_id,
        courseTitle: enrollment.courses?.title || 'N/A',
        progress: enrollment.progress || 0,
        enrolledAt: formatDate(enrollment.enrolled_at),
        lastActivity: formatDate(enrollment.updated_at),
        status: enrollment.progress === 100 ? 'Completed' : 'In Progress',
      })
    })

    return workbook
  }

  async generateUserActivityReport(options: ReportOptions = {}) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('User Activity')

    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 30 },
      { header: 'User Email', key: 'email', width: 30 },
      { header: 'Action', key: 'action', width: 25 },
      { header: 'Details', key: 'details', width: 40 },
      { header: 'IP Address', key: 'ipAddress', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    let query = this.supabase
      .from('user_activity_logs')
      .select(`
        *,
        users:user_id (email)
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data: activities, error } = await query

    if (error) {
      throw new Error(`Failed to fetch activity data: ${error.message}`)
    }

    activities?.forEach((activity: any) => {
      worksheet.addRow({
        userId: activity.user_id,
        email: activity.users?.email || 'N/A',
        action: activity.action,
        details: activity.details,
        ipAddress: activity.ip_address,
        timestamp: formatDate(activity.created_at),
      })
    })

    return workbook
  }

  async generateAssessmentResultsReport(options: ReportOptions = {}) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Assessment Results')

    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 30 },
      { header: 'User Email', key: 'email', width: 30 },
      { header: 'Assessment ID', key: 'assessmentId', width: 30 },
      { header: 'Assessment Title', key: 'title', width: 40 },
      { header: 'Score', key: 'score', width: 15 },
      { header: 'Max Score', key: 'maxScore', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
      { header: 'Passed', key: 'passed', width: 10 },
      { header: 'Submitted At', key: 'submittedAt', width: 20 },
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    let query = this.supabase
      .from('assessment_submissions')
      .select(`
        *,
        users:user_id (email),
        assessments:assessment_id (title, passing_score)
      `)
      .order('submitted_at', { ascending: false })

    if (options.startDate) {
      query = query.gte('submitted_at', options.startDate.toISOString())
    }
    if (options.endDate) {
      query = query.lte('submitted_at', options.endDate.toISOString())
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data: submissions, error } = await query

    if (error) {
      throw new Error(`Failed to fetch assessment data: ${error.message}`)
    }

    submissions?.forEach((submission: any) => {
      const maxScore = submission.assessments?.max_score || 100
      const percentage = (submission.score / maxScore) * 100
      const passed = percentage >= (submission.assessments?.passing_score || 70)

      worksheet.addRow({
        userId: submission.user_id,
        email: submission.users?.email || 'N/A',
        assessmentId: submission.assessment_id,
        title: submission.assessments?.title || 'N/A',
        score: submission.score,
        maxScore: maxScore,
        percentage: `${percentage.toFixed(1)}%`,
        passed: passed ? 'Yes' : 'No',
        submittedAt: formatDate(submission.submitted_at),
      })
    })

    return workbook
  }

  async generateComprehensiveReport(options: ReportOptions = {}) {
    const workbook = new ExcelJS.Workbook()

    // Generate all reports in one workbook
    const progressSheet = await this.generateCourseProgressReport(options)
    const activitySheet = await this.generateUserActivityReport(options)
    const assessmentSheet = await this.generateAssessmentResultsReport(options)

    // Copy worksheets to main workbook
    progressSheet.worksheets.forEach(sheet => {
      const newSheet = workbook.addWorksheet(`Progress - ${sheet.name}`)
      this.copyWorksheet(sheet, newSheet)
    })

    activitySheet.worksheets.forEach(sheet => {
      const newSheet = workbook.addWorksheet(`Activity - ${sheet.name}`)
      this.copyWorksheet(sheet, newSheet)
    })

    assessmentSheet.worksheets.forEach(sheet => {
      const newSheet = workbook.addWorksheet(`Assessments - ${sheet.name}`)
      this.copyWorksheet(sheet, newSheet)
    })

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    await this.generateSummarySheet(summarySheet, options)

    return workbook
  }

  private copyWorksheet(source: ExcelJS.Worksheet, target: ExcelJS.Worksheet) {
    // Copy columns
    target.columns = source.columns
    
    // Copy rows
    source.eachRow((row, rowNumber) => {
      const newRow = target.getRow(rowNumber)
      row.eachCell((cell, colNumber) => {
        newRow.getCell(colNumber).value = cell.value
        newRow.getCell(colNumber).style = cell.style
      })
    })
  }

  private async generateSummarySheet(worksheet: ExcelJS.Worksheet, options: ReportOptions) {
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ]

    worksheet.getRow(1).font = { bold: true }

    // Get summary statistics
    const { data: enrollments } = await this.supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })

    const { data: completedCourses } = await this.supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('progress', 100)

    const { data: activeUsers } = await this.supabase
      .from('user_activity_logs')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const { data: assessments } = await this.supabase
      .from('assessment_submissions')
      .select('score', { count: 'exact', head: true })

    worksheet.addRow(['Report Generated', new Date().toLocaleString()])
    worksheet.addRow(['Date Range', options.startDate && options.endDate ? 
      `${formatDate(options.startDate)} to ${formatDate(options.endDate)}` : 'All Time'])
    worksheet.addRow([])
    worksheet.addRow(['Total Enrollments', enrollments?.length || 0])
    worksheet.addRow(['Completed Courses', completedCourses?.length || 0])
    worksheet.addRow(['Completion Rate', enrollments?.length ? 
      `${((completedCourses?.length || 0) / enrollments.length * 100).toFixed(1)}%` : '0%'])
    worksheet.addRow(['Active Users (7 days)', activeUsers?.length || 0])
    worksheet.addRow(['Total Assessments', assessments?.length || 0])
  }
}

// Helper function to export workbook
export async function exportToExcel(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}
