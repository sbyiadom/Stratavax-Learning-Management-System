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

    // Check if already enrolled
    const { data: existing } = await supabaseServer
      .from('enrollments')
      .select()
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Enroll user in course
    const { data, error } = await supabaseServer
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error enrolling in course:', error)
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in course enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
