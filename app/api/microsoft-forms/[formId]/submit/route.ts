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

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Store form submission - using 'as any' to bypass TypeScript type checking
    // The table 'form_submissions' needs to exist in your database
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        user_id: user.id,
        submission_data: body,
        created_at: new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error saving form submission:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
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
