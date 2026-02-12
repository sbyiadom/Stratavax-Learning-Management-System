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

    // Fetch user's courses and progress
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (*)
      `)
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false })

    if (enrollmentsError) {
      throw enrollmentsError
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Stratavax LMS'
    workbook.created = new Date()
    workbook.modified = new Date()

    // Course Progress Sheet
    const progressSheet = workbook.addWorksheet('Course Progress')

    // Add headers
    progressSheet.columns = [
      { header: 'Course Title', key: 'title', width: 40 },
      { header: 'Enrolled Date', key: 'enrolled_at', width: 20 },
      { header: 'Progress (%)', key: 'progress', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Last Updated', key: 'updated_at', width: 20 },
    ]

    // Style header row
    progressSheet.getRow(1).font = { bold: true, size: 12 }
    progressSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    progressSheet.getRow(1).border = {
      bottom: { style: 'thin' },
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Add data rows
    enrollments?.forEach((enrollment) => {
      progressSheet.addRow({
        title: enrollment.courses?.title || 'Unknown Course',
        enrolled_at: new Date(enrollment.enrolled_at).toLocaleDateString(),
        progress: enrollment.progress_percentage || 0,
        status: enrollment.status === 'active' ? 'In Progress' : 'Completed',
        updated_at: new Date(enrollment.updated_at).toLocaleDateString(),
      })
    })

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ]

    summarySheet.getRow(1).font = { bold: true }
    
    summarySheet.addRow({ metric: 'Total Courses', value: enrollments?.length || 0 })
    summarySheet.addRow({ 
      metric: 'Completed Courses', 
      value: enrollments?.filter(e => e.status === 'completed').length || 0 
    })
    summarySheet.addRow({ 
      metric: 'Average Progress', 
      value: `${Math.round(
        (enrollments?.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) || 0) / 
        (enrollments?.length || 1)
      )}%` 
    })
    summarySheet.addRow({ 
      metric: 'Report Generated', 
      value: new Date().toLocaleString() 
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="course-progress-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Excel export' },
      { status: 500 }
    )
  }
}
