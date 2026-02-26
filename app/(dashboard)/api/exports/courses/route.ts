import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    // Fixed: Added await
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or instructor (optional)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Course Progress')

    // Style the header row
    worksheet.columns = [
      { header: 'Course Title', key: 'title', width: 30 },
      { header: 'Instructor', key: 'instructor', width: 20 },
      { header: 'Level', key: 'level', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
      { header: 'Total Students', key: 'totalStudents', width: 15 },
      { header: 'Avg Progress (%)', key: 'avgProgress', width: 15 },
      { header: 'Completion Rate (%)', key: 'completionRate', width: 15 }
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data
    if (courses && courses.length > 0) {
      courses.forEach(course => {
        const enrollments = course.enrollments || []
        const totalStudents = enrollments.length
        const avgProgress = enrollments.length > 0
          ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress_percentage || 0), 0) / enrollments.length)
          : 0
        const completedCount = enrollments.filter((e: any) => e.status === 'completed').length
        const completionRate = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0

        worksheet.addRow({
          title: course.title || 'N/A',
          instructor: course.instructor || 'N/A',
          level: course.level || 'N/A',
          duration: course.duration || 'N/A',
          totalStudents,
          avgProgress,
          completionRate
        })
      })
    } else {
      worksheet.addRow({
        title: 'No courses found',
        instructor: '',
        level: '',
        duration: '',
        totalStudents: 0,
        avgProgress: 0,
        completionRate: 0
      })
    }

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
