import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Verify webhook signature (customize based on your provider)
function verifySignature(signature: string | null, body: string, secret: string): boolean {
  if (!signature) return false
  
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(body).digest('hex')
  return signature === digest
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-webhook-signature')
    const webhookSecret = process.env.WEBHOOK_SECRET

    // Verify webhook signature if secret is configured
    if (webhookSecret && !verifySignature(signature, body, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    const supabase = await createClient()
    
    // Process different webhook events
    switch (payload.type) {
      case 'user.created':
        await handleUserCreated(payload.data)
        break
      case 'user.updated':
        await handleUserUpdated(payload.data)
        break
      case 'user.deleted':
        await handleUserDeleted(payload.data)
        break
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data)
        break
      case 'payment.failed':
        await handlePaymentFailed(payload.data)
        break
      case 'course.completed':
        await handleCourseCompleted(payload.data)
        break
      default:
        console.log('Unhandled webhook event:', payload.type)
    }

    // Log webhook for auditing
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: payload.type,
        payload: payload,
        received_at: new Date().toISOString(),
      })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: any) {
  const supabase = await createClient()
  
  await supabase
    .from('user_profiles')
    .insert({
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      created_at: new Date().toISOString(),
    })
}

async function handleUserUpdated(data: any) {
  const supabase = await createClient()
  
  await supabase
    .from('user_profiles')
    .update({
      email: data.email,
      full_name: data.full_name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)
}

async function handleUserDeleted(data: any) {
  const supabase = await createClient()
  
  // Archive user data instead of deleting
  await supabase
    .from('user_profiles')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', data.id)
}

async function handlePaymentSucceeded(data: any) {
  const supabase = await createClient()
  
  await supabase
    .from('enrollments')
    .update({ 
      payment_status: 'paid',
      payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.enrollmentId)
}

async function handlePaymentFailed(data: any) {
  const supabase = await createClient()
  
  await supabase
    .from('enrollments')
    .update({ 
      payment_status: 'failed',
      failure_reason: data.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.enrollmentId)
}

async function handleCourseCompleted(data: any) {
  const supabase = await createClient()
  
  await supabase
    .from('enrollments')
    .update({ 
      progress: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', data.userId)
    .eq('course_id', data.courseId)
  
  // Award certificate
  await supabase
    .from('certificates')
    .insert({
      user_id: data.userId,
      course_id: data.courseId,
      issued_at: new Date().toISOString(),
      certificate_url: data.certificateUrl,
    })
}
