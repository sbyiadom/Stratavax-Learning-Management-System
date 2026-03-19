import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create submission object matching database.types.ts
    const submission = {
      user_id: user.id,
      assessment_id: body.assessmentId,
      answers: body.answers || {},
      score: body.score || 0,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    // Insert with type assertion
    const { data, error } = await supabase
      .from('assessment_submissions')
      .insert(submission as any)

    if (error) {
      console.error('Error submitting assessment:', error)
      return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in assessment submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
