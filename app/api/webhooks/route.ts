import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Verify webhook signature
function verifySignature(signature: string | null, body: string, secret: string): boolean {
  if (!signature) return false
  
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(body).digest('hex')
  return signature === digest
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)
    const signature = request.headers.get('x-webhook-signature')
    const webhookSecret = process.env.WEBHOOK_SECRET

    // Verify webhook signature if secret is configured
    if (webhookSecret && !verifySignature(signature, bodyText, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    // Process different webhook events
    const eventType = body.event || body.type
    
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(body.data || body, supabase)
        break
      case 'user.updated':
        await handleUserUpdated(body.data || body, supabase)
        break
      case 'user.deleted':
        await handleUserDeleted(body.data || body, supabase)
        break
      case 'payment.succeeded':
        await handlePaymentSucceeded(body.data || body, supabase)
        break
      case 'payment.failed':
        await handlePaymentFailed(body.data || body, supabase)
        break
      case 'course.completed':
        await handleCourseCompleted(body.data || body, supabase)
        break
      default:
        console.log('Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: any, supabase: any) {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: data.id,
      email: data.email,
      first_name: data.first_name || data.full_name?.split(' ')[0] || '',
      last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)

  if (error) {
    console.error('Error creating user profile:', error)
  }
}

async function handleUserUpdated(data: any, supabase: any) {
  const { error } = await supabase
    .from('profiles')
    .update({
      email: data.email,
      first_name: data.first_name || data.full_name?.split(' ')[0] || '',
      last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', data.id)

  if (error) {
    console.error('Error updating user profile:', error)
  }
}

async function handleUserDeleted(data: any, supabase: any) {
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: '[deleted]',
      last_name: '[deleted]',
      email: null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', data.id)

  if (error) {
    console.error('Error archiving user profile:', error)
  }
}

async function handlePaymentSucceeded(data: any, supabase: any) {
  const { error } = await supabase
    .from('enrollments')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', data.enrollmentId)

  if (error) {
    console.error('Error updating enrollment:', error)
  }
}

async function handlePaymentFailed(data: any, supabase: any) {
  const { error } = await supabase
    .from('enrollments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', data.enrollmentId)

  if (error) {
    console.error('Error updating enrollment:', error)
  }
}

async function handleCourseCompleted(data: any, supabase: any) {
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .update({
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
      status: 'completed',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('user_id', data.userId)
    .eq('course_id', data.courseId)

  if (enrollmentError) {
    console.error('Error updating enrollment:', enrollmentError)
  }
  
  const { error: certError } = await supabase
    .from('certificates')
    .insert({
      user_id: data.userId,
      course_id: data.courseId,
      issue_date: new Date().toISOString(),
      certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)

  if (certError) {
    console.error('Error creating certificate:', certError)
  }
}
