import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = await createClient()
    const { formId } = params

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch form data with course information
    const { data: form, error } = await supabase
      .from('microsoft_forms')
      .select(`
        *,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('id', formId)
      .single()

    if (error) {
      console.error('Error fetching form:', error)
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this form (enrolled in the course)
    if (form.courses) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', form.courses.id)
        .single()

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You do not have access to this form' },
          { status: 403 }
        )
      }
    }

    // Check if user has already submitted this form
    const { data: existingSubmission } = await supabase
      .from('form_submissions')
      .select('id, submission_data, created_at')
      .eq('form_id', formId)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ 
      form,
      submission: existingSubmission || null
    })
  } catch (error) {
    console.error('Error in form fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Verify form exists
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

    // Check if user has already submitted
    const { data: existingSubmission } = await supabase
      .from('form_submissions')
      .select('id')
      .eq('form_id', formId)
      .eq('user_id', user.id)
      .single()

    if (existingSubmission) {
      // Update existing submission
      const { data, error } = await supabase
        .from('form_submissions')
        .update({
          submission_data: body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubmission.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating form submission:', error)
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        submissionId: data.id,
        message: 'Form updated successfully' 
      })
    } else {
      // Create new submission
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
    }
  } catch (error) {
    console.error('Error in form submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
