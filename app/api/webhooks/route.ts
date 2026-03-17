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
    const logQuery = supabase
      .from('webhook_logs')
      .insert({
        event_type: payload.type,
        payload: payload,
        received_at: new Date().toISOString(),
      })
    
    const { error: logError } = await (logQuery as any)

    if (logError) {
      console.error('Error logging webhook:', logError)
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

async function handleUserCreated(data: any) {
  const supabase = await createClient()
  
  const query = supabase
    .from('profiles')
    .insert({
      id: data.id,
      email: data.email,
      first_name: data.first_name || data.full_name?.split(' ')[0] || '',
      last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  
  const { error } = await (query as any)

  if (error) {
    console.error('Error creating user profile:', error)
  }
}

async function handleUserUpdated(data: any) {
  const supabase = await createClient()
  
  const query = supabase
    .from('profiles')
    .update({
      email: data.email,
      first_name: data.first_name || data.full_name?.split(' ')[0] || '',
      last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)
  
  const { error } = await (query as any)

  if (error) {
    console.error('Error updating user profile:', error)
  }
}

async function handleUserDeleted(data: any) {
  const supabase = await createClient()
  
  // Archive user data instead of deleting
  const query = supabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', data.id)
  
  const { error } = await (query as any)

  if (error) {
    console.error('Error archiving user profile:', error)
  }
}

async function handlePaymentSucceeded(data: any) {
  const supabase = await createClient()
  
  // Check if enrollment exists
  const checkQuery = supabase
    .from('enrollments')
    .select('id')
    .eq('id', data.enrollmentId)
    .single()
  
  const { data: enrollment } = await (checkQuery as any)

  if (enrollment) {
    // Update existing enrollment
    const updateQuery = supabase
      .from('enrollments')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.enrollmentId)
    
    const { error } = await (updateQuery as any)

    if (error) {
      console.error('Error updating enrollment:', error)
    }
  } else {
    // Create new enrollment if it doesn't exist
    const insertQuery = supabase
      .from('enrollments')
      .insert({
        id: data.enrollmentId,
        user_id: data.userId,
        course_id: data.courseId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        updated_at: new Date().toISOString(),
      })
    
    const { error } = await (insertQuery as any)

    if (error) {
      console.error('Error creating enrollment:', error)
    }
  }
}

async function handlePaymentFailed(data: any) {
  const supabase = await createClient()
  
  const query = supabase
    .from('enrollments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.enrollmentId)
  
  const { error } = await (query as any)

  if (error) {
    console.error('Error updating enrollment:', error)
  }
}

async function handleCourseCompleted(data: any) {
  const supabase = await createClient()
  
  // Update enrollment
  const enrollmentQuery = supabase
    .from('enrollments')
    .update({
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', data.userId)
    .eq('course_id', data.courseId)
  
  const { error: enrollmentError } = await (enrollmentQuery as any)

  if (enrollmentError) {
    console.error('Error updating enrollment:', enrollmentError)
  }
  
  // Award certificate
  const certQuery = supabase
    .from('certificates')
    .insert({
      user_id: data.userId,
      course_id: data.courseId,
      issued_at: new Date().toISOString(),
      certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    })
  
  const { error: certError } = await (certQuery as any)

  if (certError) {
    console.error('Error creating certificate:', certError)
  }
}
