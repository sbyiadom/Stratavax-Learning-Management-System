import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { assessmentId, answers, courseId } = await request.json()
    
    // Fixed: Added await
    const supabase = await createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Calculate score
    let score = 0
    const totalQuestions = assessment.questions?.length || 0
    
    if (totalQuestions > 0) {
      assessment.questions.forEach((question: any, index: number) => {
        if (answers[index] === question.correctAnswer) {
          score++
        }
      })
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    const passed = percentage >= (assessment.passing_score || 70)

    // Save the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .insert({
        user_id: session.user.id,
        assessment_id: assessmentId,
        course_id: courseId,
        answers,
        score: percentage,
        passed,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (attemptError) {
      return NextResponse.json(
        { error: 'Failed to save attempt' },
        { status: 500 }
      )
    }

    // Update user progress if passed
    if (passed) {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: session.user.id,
          course_id: courseId,
          assessment_id: assessmentId,
          is_completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,assessment_id'
        })
    }

    return NextResponse.json({
      attempt,
      score: percentage,
      passed,
      totalQuestions,
      correctAnswers: score
    })

  } catch (error) {
    console.error('Assessment submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
