import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formId = params.formId
    
    // Mock form data
    const mockForm = {
      id: formId,
      title: 'Course Assessment',
      questions: [
        {
          id: 'q1',
          title: 'Which of the following is a React hook?',
          type: 'choice',
          required: true,
          choices: [
            { id: '1', displayText: 'useEffect', value: 'useEffect' },
            { id: '2', displayText: 'componentDidMount', value: 'componentDidMount' },
            { id: '3', displayText: 'onClick', value: 'onClick' },
            { id: '4', displayText: 'setState', value: 'setState' },
          ],
        },
        {
          id: 'q2',
          title: 'What is the capital of France?',
          type: 'choice',
          required: true,
          choices: [
            { id: '1', displayText: 'London', value: 'london' },
            { id: '2', displayText: 'Berlin', value: 'berlin' },
            { id: '3', displayText: 'Paris', value: 'paris' },
            { id: '4', displayText: 'Madrid', value: 'madrid' },
          ],
        },
      ],
    }

    return NextResponse.json({ success: true, form: mockForm })
  } catch (error) {
    console.error('Microsoft Forms API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { responses, lessonId } = body

    // Calculate score
    let score = 0
    if (responses?.q1 === 'useEffect') score += 50
    if (responses?.q2 === 'paris') score += 50

    // Save assessment
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: user.id,
        form_id: params.formId,
        lesson_id: lessonId,
        responses: responses || {},
        score,
        max_score: 100,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving assessment:', error)
      return NextResponse.json(
        { error: 'Failed to save assessment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submissionId: data.id,
      score,
      message: 'Form submitted successfully',
    })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
