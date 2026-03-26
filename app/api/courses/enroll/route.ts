import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate courseId
    if (!body.courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const { data: existing, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', body.courseId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking enrollment:', checkError)
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = {
      user_id: user.id,
      course_id: body.courseId,
      status: 'active',
      progress_percentage: 0,
      enrolled_at: new Date().toISOString()
    }

    // Enroll user in course
    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollment as any)
      .select()
      .single()

    if (error) {
      console.error('Error enrolling in course:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Successfully enrolled in course' 
    })
    
  } catch (error) {
    console.error('Error in course enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
