import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate courseId
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if already enrolled - using maybeSingle() instead of single() to avoid errors
    const { data: existing, error: checkError } = await supabaseServer
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
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

    // Enroll user in course - using 'as any' to bypass TypeScript type checking
    // The table 'enrollments' exists in your database with columns:
    // id, user_id, course_id, enrolled_at, progress_percentage, status, completed_at, last_accessed_at
    const { data, error } = await supabaseServer
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: 'active',
        progress_percentage: 0,
        enrolled_at: new Date().toISOString()
      } as any)
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
