import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Helper function to calculate difference and percent shift
function calculateMetrics(pre: number, post: number, possible: number) {
  const difference = post - pre
  const percentShift = possible > 0 ? (difference / possible) * 100 : 0
  return {
    difference,
    percentShift: Math.round(percentShift * 100) / 100 // Round to 2 decimal places
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const courseName = searchParams.get('course_name')
    const department = searchParams.get('department')
    const staffNumber = searchParams.get('staff_number')
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabase
      .from('evaluation_reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (courseName) query = query.eq('course_name', courseName)
    if (department) query = query.eq('department', department)
    if (staffNumber) query = query.eq('staff_number', staffNumber)
    if (status) query = query.eq('status', status)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching evaluation reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
    
    // Add calculated fields to each record
    const dataWithCalculations = data?.map(record => {
      const { difference, percentShift } = calculateMetrics(
        record.pre_assessment_score || 0,
        record.post_assessment_score || 0,
        record.possible_score || 100
      )
      return {
        ...record,
        difference,
        percent_shift: percentShift
      }
    })
    
    // Get unique filter options
    const { data: courses } = await supabase
      .from('evaluation_reports')
      .select('course_name')
      .not('course_name', 'is', null)
    
    const { data: departments } = await supabase
      .from('evaluation_reports')
      .select('department')
      .not('department', 'is', null)
    
    const uniqueCourses = [...new Set(courses?.map(c => c.course_name) || [])]
    const uniqueDepartments = [...new Set(departments?.map(d => d.department) || [])]
    
    return NextResponse.json({
      success: true,
      data: dataWithCalculations,
      pagination: { total: count || 0, limit, offset },
      filters: { courses: uniqueCourses, departments: uniqueDepartments }
    })
    
  } catch (error) {
    console.error('Error in evaluation reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.course_name || !body.staff_number || !body.name_surname) {
      return NextResponse.json(
        { error: 'Missing required fields: course_name, staff_number, name_surname' },
        { status: 400 }
      )
    }
    
    // Calculate metrics for response (they won't be stored in DB)
    const { difference, percentShift } = calculateMetrics(
      body.pre_assessment_score || 0,
      body.post_assessment_score || 0,
      body.possible_score || 100
    )
    
    const { data, error } = await supabase
      .from('evaluation_reports')
      .insert({
        course_name: body.course_name,
        staff_number: body.staff_number,
        name_surname: body.name_surname,
        job_title: body.job_title,
        plant: body.plant,
        department: body.department,
        pass_mark: body.pass_mark || 0,
        pre_assessment_score: body.pre_assessment_score || 0,
        post_assessment_score: body.post_assessment_score || 0,
        possible_score: body.possible_score || 100,
        re_test: body.re_test || false,
        re_test_score: body.re_test_score,
        commentary: body.commentary,
        status: body.status || 'draft',
        submitted_by: user.id,
        submitted_at: body.status === 'submitted' ? new Date().toISOString() : null,
        training_record_id: body.training_record_id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating evaluation report:', error)
      return NextResponse.json({ error: 'Failed to create report: ' + error.message }, { status: 500 })
    }
    
    // Return with calculated fields
    return NextResponse.json({ 
      success: true, 
      data: {
        ...data,
        difference,
        percent_shift: percentShift
      }
    })
    
  } catch (error) {
    console.error('Error in evaluation reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }
    
    // Calculate metrics for response
    const { difference, percentShift } = calculateMetrics(
      body.pre_assessment_score || 0,
      body.post_assessment_score || 0,
      body.possible_score || 100
    )
    
    const updateData: any = {
      course_name: body.course_name,
      staff_number: body.staff_number,
      name_surname: body.name_surname,
      job_title: body.job_title,
      plant: body.plant,
      department: body.department,
      pass_mark: body.pass_mark,
      pre_assessment_score: body.pre_assessment_score,
      post_assessment_score: body.post_assessment_score,
      possible_score: body.possible_score,
      re_test: body.re_test,
      re_test_score: body.re_test_score,
      commentary: body.commentary,
      status: body.status,
      updated_at: new Date().toISOString()
    }
    
    if (body.status === 'submitted' && !body.submitted_at) {
      updateData.submitted_at = new Date().toISOString()
      updateData.submitted_by = user.id
    }
    
    const { data, error } = await supabase
      .from('evaluation_reports')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating evaluation report:', error)
      return NextResponse.json({ error: 'Failed to update report: ' + error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...data,
        difference,
        percent_shift: percentShift
      }
    })
    
  } catch (error) {
    console.error('Error in evaluation reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('evaluation_reports')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting evaluation report:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in evaluation reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
