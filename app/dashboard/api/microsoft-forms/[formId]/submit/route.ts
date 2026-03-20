import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = await createClient()
    const { formId } = params
    const body = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify form exists and user has access
    const { data: form, error: formError } = await supabase
      .from('microsoft_forms')
      .select('id, course_id')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', form.course_id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to submit the form' },
        { status: 403 }
      )
    }

    // Store form submission
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        user_id: user.id,
        submission_data: body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving form submission:', error)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: data.id,
      message: 'Form submitted successfully' 
    })
  } catch (error) {
    console.error('Error in form submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
