import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'

// Webhook secret for verification (set this in your environment variables)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const headersList = headers()
    const signature = headersList.get('x-webhook-signature')
    
    // In production, verify the signature matches your secret
    // This is a simplified example
    if (!signature || signature !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { event, data } = body

    const supabase = createAdminClient()

    // Handle different webhook events
    switch (event) {
      case 'course.created':
        // Handle course creation from external system
        await supabase.from('courses').insert(data)
        break
        
      case 'user.updated':
        // Handle user updates from external system
        await supabase
          .from('profiles')
          .update(data)
          .eq('id', data.user_id)
        break
        
      case 'assessment.completed':
        // Handle assessment completion
        await supabase
          .from('assessments')
          .insert({
            user_id: data.user_id,
            lesson_id: data.lesson_id,
            score: data.score,
            responses: data.responses,
            submitted_at: new Date().toISOString(),
          })
        break
        
      case 'github.sync':
        // Handle GitHub repository sync request
        // This would trigger the GitHub sync process
        console.log('GitHub sync requested for course:', data.course_id)
        break
        
      default:
        console.log('Unhandled webhook event:', event)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully' 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    // Respond to webhook verification challenge
    return new NextResponse(challenge)
  }
  
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
