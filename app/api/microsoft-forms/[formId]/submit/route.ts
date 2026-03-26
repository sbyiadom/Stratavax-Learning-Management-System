import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
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

    // Validate formId
    if (!params.formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Save form submission
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: params.formId,
        user_id: user.id,
        submission_data: body,
        created_at: new Date().toISOString()
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
        { error: 'Failed to save form submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Form submitted successfully' 
    })
    
  } catch (error) {
    console.error('Error in Microsoft Forms submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
