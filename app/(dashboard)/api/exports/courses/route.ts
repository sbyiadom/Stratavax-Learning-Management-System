import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    // IMPORTANT: Add await here
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all courses with enrollment data
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments(
          user_id,
          progress_percentage,
          status,
          profiles(
            first_name,
            last_name,
            email
          )
        )
      `)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Course Progress')

    // Add headers
    worksheet.columns = [
      { header: 'Course Title', key: 'title', width: 30 },
      { header: 'Instructor', key: 'instructor', width: 20 },
      { header: 'Level', key: 'level', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
      { header: 'Total Students', key: 'totalStudents', width: 15 },
      { header: 'Avg Progress', key: 'avgProgress', width: 15 },
      { header: 'Completion Rate', key: 'completionRate', width: 15 }
    ]

    // Add data
    courses?.forEach(course => {
      const enrollments = course.enrollments || []
      const totalStudents = enrollments.length
      const avgProgress = enrollments.length > 0
        ? enrollments.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / enrollments.length
        : 0
      const completedCount = enrollments.filter((e: any) => e.status === 'completed').length
      const completionRate = enrollments.length > 0 ? (completedCount / enrollments.length) * 100 : 0

      worksheet.addRow({
        title: course.title,
        instructor: course.instructor,
        level: course.level,
        duration: course.duration,
        totalStudents,
        avgProgress: Math.round(avgProgress) + '%',
        completionRate: Math.round(completionRate) + '%'
      })
    })

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=course-progress-${new Date().toISOString().split('T')[0]}.xlsx`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
