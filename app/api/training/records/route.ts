import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const course = searchParams.get('course')
    const department = searchParams.get('department')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('training_records')
      .select(`
        id,
        attendee_name,
        role,
        course,
        facilitator,
        supervisor,
        department,
        duration_hours,
        training_date,
        personnel_number,
        country,
        location,
        line_manager,
        acknowledged,
        source,
        submitted_at,
        created_at,
        training_evaluations (
          id,
          content_rating,
          facilitator_rating,
          logistics_rating,
          engagement_rating,
          applicability_rating,
          comments,
          one_word
        )
      `)
      .order('training_date', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (startDate) {
      query = query.gte('training_date', startDate)
    }
    if (endDate) {
      query = query.lte('training_date', endDate)
    }
    if (course) {
      query = query.eq('course', course)
    }
    if (department) {
      query = query.eq('department', department)
    }
    if (source) {
      query = query.eq('source', source)
    }
    
    const { data: records, error: recordsError } = await query
    
    if (recordsError) {
      console.error('Error fetching training records:', recordsError)
      return NextResponse.json(
        { error: 'Failed to fetch training records' },
        { status: 500 }
      )
    }
    
    // Get total count for pagination
    let countQuery = supabase
      .from('training_records')
      .select('*', { count: 'exact', head: true })
    
    if (startDate) {
      countQuery = countQuery.gte('training_date', startDate)
    }
    if (endDate) {
      countQuery = countQuery.lte('training_date', endDate)
    }
    if (course) {
      countQuery = countQuery.eq('course', course)
    }
    if (department) {
      countQuery = countQuery.eq('department', department)
    }
    if (source) {
      countQuery = countQuery.eq('source', source)
    }
    
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error fetching count:', countError)
    }
    
    // Get unique courses for filter dropdown - FIXED
    const { data: coursesData } = await supabase
      .from('training_records')
      .select('course')
      .not('course', 'is', null)
    
    const uniqueCourses: string[] = []
    if (coursesData) {
      const courseMap = new Map<string, boolean>()
      coursesData.forEach(item => {
        if (item.course && !courseMap.has(item.course)) {
          courseMap.set(item.course, true)
          uniqueCourses.push(item.course)
        }
      })
      uniqueCourses.sort()
    }
    
    // Get unique departments for filter dropdown - FIXED
    const { data: departmentsData } = await supabase
      .from('training_records')
      .select('department')
      .not('department', 'is', null)
    
    const uniqueDepartments: string[] = []
    if (departmentsData) {
      const deptMap = new Map<string, boolean>()
      departmentsData.forEach(item => {
        if (item.department && !deptMap.has(item.department)) {
          deptMap.set(item.department, true)
          uniqueDepartments.push(item.department)
        }
      })
      uniqueDepartments.sort()
    }
    
    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      },
      filters: {
        courses: uniqueCourses,
        departments: uniqueDepartments
      }
    })
    
  } catch (error) {
    console.error('Error in training records API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.attendee_name || !body.course) {
      return NextResponse.json(
        { error: 'Missing required fields: attendee_name and course are required' },
        { status: 400 }
      )
    }
    
    // Insert new training record
    const { data: record, error: insertError } = await supabase
      .from('training_records')
      .insert({
        attendee_name: body.attendee_name,
        role: body.role || '',
        course: body.course,
        facilitator: body.facilitator || '',
        supervisor: body.supervisor || '',
        department: body.department || '',
        duration_hours: body.duration_hours || 0,
        training_date: body.training_date || new Date().toISOString().split('T')[0],
        personnel_number: body.personnel_number || '',
        country: body.country || '',
        location: body.location || '',
        line_manager: body.line_manager || '',
        acknowledged: body.acknowledged || false,
        source: body.source || 'manual'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting training record:', insertError)
      return NextResponse.json(
        { error: 'Failed to create training record' },
        { status: 500 }
      )
    }
    
    // If evaluation data is provided, insert it
    if (body.evaluation) {
      const { error: evalError } = await supabase
        .from('training_evaluations')
        .insert({
          training_record_id: record.id,
          personnel_number: body.personnel_number || '',
          attendee_name: body.attendee_name,
          course: body.course,
          training_date: body.training_date,
          content_rating: body.evaluation.content_rating || null,
          facilitator_rating: body.evaluation.facilitator_rating || null,
          logistics_rating: body.evaluation.logistics_rating || null,
          engagement_rating: body.evaluation.engagement_rating || null,
          applicability_rating: body.evaluation.applicability_rating || null,
          comments: body.evaluation.comments || '',
          one_word: body.evaluation.one_word || ''
        })
      
      if (evalError) {
        console.error('Error inserting evaluation:', evalError)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: record,
      message: 'Training record created successfully'
    })
    
  } catch (error) {
    console.error('Error in training records API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
