import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

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

    if (webhookSecret && !verifySignature(signature, bodyText, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const eventType = body.event || body.type
    
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(body.data || body)
        break
      case 'user.updated':
        await handleUserUpdated(body.data || body)
        break
      case 'user.deleted':
        await handleUserDeleted(body.data || body)
        break
      case 'payment.succeeded':
        await handlePaymentSucceeded(body.data || body)
        break
      case 'payment.failed':
        await handlePaymentFailed(body.data || body)
        break
      case 'course.completed':
        await handleCourseCompleted(body.data || body)
        break
      default:
        console.log('Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// @ts-ignore
async function handleUserCreated(data: any) {
  // @ts-ignore
  const { error } = await supabaseServer
    .from('profiles')
    .insert({
      id: data.id,
      email: data.email,
      first_name: data.first_name || data.full_name?.split(' ')[0] || '',
      last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating user profile:', error)
  }
}

// @ts-ignore
async function handleUserUpdated(data: any) {
  // @ts-ignore
  const { error } = await supabaseServer
    .from('profiles')
    .update({
      email: data.email,
      first_name: data.first_name || data.full_name?.split(' ')[0] || '',
      last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) {
    console.error('Error updating user profile:', error)
  }
}

// @ts-ignore
async function handleUserDeleted(data: any) {
  // @ts-ignore
  const { error } = await supabaseServer
    .from('profiles')
    .update({
      first_name: '[deleted]',
      last_name: '[deleted]',
      email: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) {
    console.error('Error archiving user profile:', error)
  }
}

// @ts-ignore
async function handlePaymentSucceeded(data: any) {
  // @ts-ignore
  const { error } = await supabaseServer
    .from('enrollments')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.enrollmentId)

  if (error) {
    console.error('Error updating enrollment:', error)
  }
}

// @ts-ignore
async function handlePaymentFailed(data: any) {
  // @ts-ignore
  const { error } = await supabaseServer
    .from('enrollments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.enrollmentId)

  if (error) {
    console.error('Error updating enrollment:', error)
  }
}

// @ts-ignore
async function handleCourseCompleted(data: any) {
  // @ts-ignore
  const { error: enrollmentError } = await supabaseServer
    .from('enrollments')
    .update({
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', data.userId)
    .eq('course_id', data.courseId)

  if (enrollmentError) {
    console.error('Error updating enrollment:', enrollmentError)
  }
  
  // @ts-ignore
  const { error: certError } = await supabaseServer
    .from('certificates')
    .insert({
      user_id: data.userId,
      course_id: data.courseId,
      issue_date: new Date().toISOString(),
      certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (certError) {
    console.error('Error creating certificate:', certError)
  }
}
