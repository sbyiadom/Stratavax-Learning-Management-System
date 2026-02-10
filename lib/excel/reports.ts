import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export async function generateCourseReport(courseId: string) {
  const supabase = await createClient()
  
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
      user:users(email, first_name, last_name)
    `)
    .eq('course_id', courseId)
  
  // Fetch assessment results
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      *,
      submissions:assessment_submissions(*)
    `)
    .eq('course_id', courseId)
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  
  // 1. Course Overview Sheet
  const overviewData = [{
    'Course Title': course?.title,
    'Instructor': course?.instructor_id,
    'Total Enrollments': enrollments?.length || 0,
    'Average Progress': enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / (enrollments?.length || 1),
    'Completion Rate': (enrollments?.filter(e => e.status === 'completed').length || 0) / (enrollments?.length || 1) * 100,
    'Created Date': course?.created_at
  }]
  
  const overviewSheet = XLSX.utils.json_to_sheet(overviewData)
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Course Overview')
  
  // 2. Student Progress Sheet
  const progressData = enrollments?.map(enrollment => ({
    'Student Name': `${enrollment.user?.first_name} ${enrollment.user?.last_name}`,
    'Email': enrollment.user?.email,
    'Enrollment Date': enrollment.enrolled_at,
    'Progress (%)': enrollment.progress_percentage,
    'Status': enrollment.status,
    'Last Active': enrollment.updated_at,
    'Time Spent (min)': 0 // Would calculate from user_progress
  })) || []
  
  const progressSheet = XLSX.utils.json_to_sheet(progressData)
  XLSX.utils.book_append_sheet(workbook, progressSheet, 'Student Progress')
  
  // 3. Assessment Results Sheet
  const assessmentData = []
  assessments?.forEach(assessment => {
    assessment.submissions?.forEach((submission: any) => {
      assessmentData.push({
        'Assessment': assessment.title,
        'Student': submission.user_id, // Would join with users
        'Score': submission.score,
        'Max Score': assessment.max_score,
        'Passing Score': assessment.passing_score,
        'Status': submission.status,
        'Submitted At': submission.submitted_at,
        'Graded At': submission.graded_at
      })
    })
  })
  
  if (assessmentData.length > 0) {
    const assessmentSheet = XLSX.utils.json_to_sheet(assessmentData)
    XLSX.utils.book_append_sheet(workbook, assessmentSheet, 'Assessment Results')
  }
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
