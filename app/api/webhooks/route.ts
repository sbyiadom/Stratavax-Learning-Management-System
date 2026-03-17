import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Define types inline since we don't have generated types yet
type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

type Enrollment = {
  id?: string
  user_id: string
  course_id: string
  status: string
  enrolled_at: string
  completed_at?: string | null
  progress_percentage: number
  created_at: string
  updated_at: string
}

type Certificate = {
  id?: string
  user_id: string
  course_id: string
  issued_at: string
  certificate_number: string
  created_at: string
}

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
      console.log('Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    console.log('Processing webhook event:', payload.type)
    
    const supabase = await createClient()
    
    // Process different webhook events
    switch (payload.type) {
      case 'user.created':
        await handleUserCreated(payload.data, supabase)
        break
      case 'user.updated':
        await handleUserUpdated(payload.data, supabase)
        break
      case 'user.deleted':
        await handleUserDeleted(payload.data, supabase)
        break
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data, supabase)
        break
      case 'payment.failed':
        await handlePaymentFailed(payload.data, supabase)
        break
      case 'course.completed':
        await handleCourseCompleted(payload.data, supabase)
        break
      default:
        console.log('Unhandled webhook event:', payload.type)
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
  console.log('Handling user.created for:', data.email || data.id)
  
  // Parse name from either first_name/last_name or full_name
  let firstName = data.first_name || ''
  let lastName = data.last_name || ''
  
  if (data.full_name && !firstName && !lastName) {
    const nameParts = data.full_name.split(' ')
    firstName = nameParts[0] || ''
    lastName = nameParts.slice(1).join(' ') || ''
  }

  const now = new Date().toISOString()
  
  const profile: Profile = {
    id: data.id,
    email: data.email,
    first_name: firstName,
    last_name: lastName,
    avatar_url: data.avatar_url || null,
    created_at: now,
    updated_at: now,
  }

  const { error } = await supabase
    .from('profiles')
    .insert(profile)

  if (error) {
    console.error('Error creating user profile:', error)
    // Log the actual error for debugging
    console.error('Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log('Successfully created user profile for:', data.email)
  }
}

async function handleUserUpdated(data: any, supabase: any) {
  console.log('Handling user.updated for:', data.email || data.id)
  
  // Parse name from either first_name/last_name or full_name
  let firstName = data.first_name || ''
  let lastName = data.last_name || ''
  
  if (data.full_name && !firstName && !lastName) {
    const nameParts = data.full_name.split(' ')
    firstName = nameParts[0] || ''
    lastName = nameParts.slice(1).join(' ') || ''
  }

  const updates = {
    email: data.email,
    first_name: firstName,
    last_name: lastName,
    avatar_url: data.avatar_url,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', data.id)

  if (error) {
    console.error('Error updating user profile:', error)
  } else {
    console.log('Successfully updated user profile for:', data.email)
  }
}

async function handleUserDeleted(data: any, supabase: any) {
  console.log('Handling user.deleted for:', data.id)
  
  // Soft delete by clearing sensitive data
  const updates = {
    first_name: '[deleted]',
    last_name: '[deleted]',
    email: null,
    avatar_url: null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', data.id)

  if (error) {
    console.error('Error archiving user profile:', error)
  } else {
    console.log('Successfully archived user profile')
  }
}

async function handlePaymentSucceeded(data: any, supabase: any) {
  console.log('Handling payment.succeeded for enrollment:', data.enrollmentId)
  
  // Check if enrollment exists
  const { data: enrollment, error: selectError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('id', data.enrollmentId)
    .maybeSingle()

  if (selectError) {
    console.error('Error checking enrollment:', selectError)
    return
  }

  const now = new Date().toISOString()

  if (enrollment) {
    // Update existing enrollment
    const { error } = await supabase
      .from('enrollments')
      .update({
        status: 'active',
        updated_at: now,
      })
      .eq('id', data.enrollmentId)

    if (error) {
      console.error('Error updating enrollment:', error)
    } else {
      console.log('Successfully updated enrollment:', data.enrollmentId)
    }
  } else {
    // Create new enrollment
    const newEnrollment: Enrollment = {
      user_id: data.userId,
      course_id: data.courseId,
      status: 'active',
      enrolled_at: now,
      progress_percentage: 0,
      created_at: now,
      updated_at: now,
    }

    // Only add id if it's provided in the data
    if (data.enrollmentId) {
      newEnrollment.id = data.enrollmentId
    }

    const { error } = await supabase
      .from('enrollments')
      .insert(newEnrollment)

    if (error) {
      console.error('Error creating enrollment:', error)
    } else {
      console.log('Successfully created enrollment for user:', data.userId)
    }
  }
}

async function handlePaymentFailed(data: any, supabase: any) {
  console.log('Handling payment.failed for enrollment:', data.enrollmentId)
  
  const { error } = await supabase
    .from('enrollments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.enrollmentId)

  if (error) {
    console.error('Error updating enrollment:', error)
  } else {
    console.log('Successfully updated enrollment status to failed')
  }
}

async function handleCourseCompleted(data: any, supabase: any) {
  console.log('Handling course.completed for user:', data.userId, 'course:', data.courseId)
  
  const now = new Date().toISOString()
  
  // Update enrollment
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .update({
      progress_percentage: 100,
      completed_at: now,
      status: 'completed',
      updated_at: now,
    })
    .eq('user_id', data.userId)
    .eq('course_id', data.courseId)

  if (enrollmentError) {
    console.error('Error updating enrollment:', enrollmentError)
  } else {
    console.log('Successfully updated enrollment to completed')
  }
  
  // Create certificate
  const certificate: Certificate = {
    user_id: data.userId,
    course_id: data.courseId,
    issued_at: now,
    certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    created_at: now,
  }

  const { error: certError } = await supabase
    .from('certificates')
    .insert(certificate)

  if (certError) {
    console.error('Error creating certificate:', certError)
  } else {
    console.log('Successfully created certificate for user:', data.userId)
  }
}
