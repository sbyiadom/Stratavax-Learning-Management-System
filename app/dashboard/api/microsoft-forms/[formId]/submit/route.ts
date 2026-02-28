import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responses, courseId } = await request.json()
    const formId = params.formId

    // Store the submission in your database
    const { error } = await supabase
      .from('form_submissions')
      .insert({
        user_id: user.id,
        form_id: formId,
        course_id: courseId,
        responses,
        submitted_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving form submission:', error)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    // Update user progress
    await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lesson_id: formId,
        course_id: courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
