import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate required fields
    if (!body.assessmentId || !body.answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save assessment submission - using 'as any' to bypass TypeScript type checking
    // The table 'assessment_submissions' exists in your database (confirmed from your table list)
    const { data, error } = await supabase
      .from('assessment_submissions')
      .insert({
        user_id: user.id,
        assessment_id: body.assessmentId,
        answers: body.answers,
        score: body.score || 0,
        submitted_at: new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error saving assessment:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      return NextResponse.json(
        { error: 'Failed to save assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Assessment submitted successfully' 
    })
    
  } catch (error) {
    console.error('Error in assessment submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
