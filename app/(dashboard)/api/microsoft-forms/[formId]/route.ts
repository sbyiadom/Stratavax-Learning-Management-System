import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface MicrosoftFormResponse {
  id: string
  title: string
  questions: Array<{
    id: string
    title: string
    type: string
    required?: boolean
    choices?: Array<{
      id: string
      displayText: string
      value?: string
    }>
  }>
}

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
    
    // In a production environment, you would:
    // 1. Get the Microsoft token from user metadata or database
    // 2. Make an actual API call to Microsoft Forms API
    // 3. Handle token refresh and error cases
    
    // For now, return mock data for demonstration
    // This should be replaced with actual Microsoft Forms API integration
    
    const mockForm: MicrosoftFormResponse = {
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
        {
          id: 'q3',
          title: 'Explain the concept of closures in JavaScript.',
          type: 'text',
          required: false,
        },
      ],
    }

    return NextResponse.json({ 
      success: true, 
      form: mockForm 
    })
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

    const formId = params.formId
    const body = await request.json()
    const { responses, lessonId } = body

    if (!responses) {
      return NextResponse.json(
        { error: 'Responses are required' },
        { status: 400 }
      )
    }

    // Calculate score based on correct answers
    let score = 0
    let maxScore = 0

    // Mock scoring logic - replace with actual form configuration
    if (responses.q1 === 'useEffect') score += 1
    if (responses.q2 === 'paris') score += 1
    maxScore = 2

    // Save assessment submission
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: user.id,
        form_id: formId,
        lesson_id: lessonId || null,
        responses,
        score,
        max_score: maxScore,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving assessment:', error)
      return NextResponse.json(
        { error: 'Failed to save assessment submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submissionId: data.id,
      score,
      maxScore,
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
