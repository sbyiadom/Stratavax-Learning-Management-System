import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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

    // Here you would typically send the responses to Microsoft Forms API
    // For now, we'll just store the submission in your database

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
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
