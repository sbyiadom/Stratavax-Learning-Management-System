import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (*)
      `)
      .eq('user_id', user.id)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Course Progress')

    worksheet.columns = [
      { header: 'Course Title', key: 'title', width: 40 },
      { header: 'Enrolled Date', key: 'enrolled_at', width: 20 },
      { header: 'Progress (%)', key: 'progress', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    worksheet.getRow(1).font = { bold: true }

    enrollments?.forEach((enrollment) => {
      worksheet.addRow({
        title: enrollment.courses?.title || 'Unknown',
        enrolled_at: new Date(enrollment.enrolled_at).toLocaleDateString(),
        progress: enrollment.progress_percentage || 0,
        status: enrollment.status,
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="course-progress-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}
