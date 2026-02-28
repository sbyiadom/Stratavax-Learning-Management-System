import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')

    // Verify webhook secret if configured
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body) + timestamp)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Fixed: Added await
    const supabase = await createServerClient()

    // Process different webhook events
    const { event, data } = body

    switch (event) {
      case 'course.updated':
        await handleCourseUpdated(supabase, data)
        break
      
      case 'user.enrolled':
        await handleUserEnrolled(supabase, data)
        break
      
      case 'assessment.completed':
        await handleAssessmentCompleted(supabase, data)
        break
      
      default:
        console.log('Unknown webhook event:', event)
    }

    // Log webhook for auditing
    await supabase
      .from('webhook_logs')
      .insert({
        event,
        payload: body,
        received_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully'
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCourseUpdated(supabase: any, data: any) {
  // Update course information
  await supabase
    .from('courses')
    .update({
      title: data.title,
      description: data.description,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.courseId)
}

async function handleUserEnrolled(supabase: any, data: any) {
  // Send notification or perform other actions
  console.log('User enrolled:', data)
}

async function handleAssessmentCompleted(supabase: any, data: any) {
  // Update user progress or generate certificate
  console.log('Assessment completed:', data)
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint is active',
    usage: 'Send POST requests with webhook data'
  })
}
