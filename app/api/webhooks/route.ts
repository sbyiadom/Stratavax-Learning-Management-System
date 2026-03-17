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
  
  // First, check if we're using profiles or user_profiles table
  // Let's try to insert into profiles first, if that fails, try user_profiles
  
  try {
    // Try to insert into profiles table (first_name, last_name structure)
    const { error } = await supabase
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
      // If profiles table doesn't exist or has different structure, try user_profiles
      console.log('Failed to insert into profiles, trying user_profiles:', error.message)
      
      const { error: userProfilesError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.id,
          email: data.email,
          full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          created_at: new Date().toISOString(),
          // Set default values for other fields if they exist in the table
          role: data.role || 'student',
          department: data.department || null,
          employee_id: data.employee_id || null,
          is_active: true,
          last_active: new Date().toISOString(),
        })

      if (userProfilesError) {
        console.error('Error creating user profile in both tables:', userProfilesError)
      } else {
        console.log('Successfully created user in user_profiles table')
      }
    } else {
      console.log('Successfully created user in profiles table')
    }
  } catch (err) {
    console.error('Unexpected error in handleUserCreated:', err)
  }
}

async function handleUserUpdated(data: any) {
  const supabase = await createClient()
  
  try {
    // Try to update profiles table first
    const { error } = await supabase
      .from('profiles')
      .update({
        email: data.email,
        first_name: data.first_name || data.full_name?.split(' ')[0] || '',
        last_name: data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)

    if (error) {
      // If profiles update fails, try user_profiles
      console.log('Failed to update profiles, trying user_profiles:', error.message)
      
      const { error: userProfilesError } = await supabase
        .from('user_profiles')
        .update({
          email: data.email,
          full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })
        .eq('id', data.id)

      if (userProfilesError) {
        console.error('Error updating user profile in both tables:', userProfilesError)
      } else {
        console.log('Successfully updated user in user_profiles table')
      }
    } else {
      console.log('Successfully updated user in profiles table')
    }
  } catch (err) {
    console.error('Unexpected error in handleUserUpdated:', err)
  }
}

async function handleUserDeleted(data: any) {
  const supabase = await createClient()
  
  try {
    // Try to soft delete from profiles table first
    const { error } = await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)

    if (error) {
      // If profiles update fails, try user_profiles
      console.log('Failed to update profiles, trying user_profiles:', error.message)
      
      const { error: userProfilesError } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })
        .eq('id', data.id)

      if (userProfilesError) {
        console.error('Error deactivating user in both tables:', userProfilesError)
      } else {
        console.log('Successfully deactivated user in user_profiles table')
      }
    } else {
      console.log('Successfully updated user in profiles table')
    }
  } catch (err) {
    console.error('Unexpected error in handleUserDeleted:', err)
  }
}

async function handlePaymentSucceeded(data: any) {
  const supabase = await createClient()
  
  try {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('id', data.enrollmentId)
      .maybeSingle()

    if (enrollment) {
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.enrollmentId)

      if (error) {
        console.error('Error updating enrollment:', error)
      }
    } else {
      const { error } = await supabase
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

      if (error) {
        console.error('Error creating enrollment:', error)
      }
    }
  } catch (err) {
    console.error('Unexpected error in handlePaymentSucceeded:', err)
  }
}

async function handlePaymentFailed(data: any) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('enrollments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.enrollmentId)

    if (error) {
      console.error('Error updating enrollment:', error)
    }
  } catch (err) {
    console.error('Unexpected error in handlePaymentFailed:', err)
  }
}

async function handleCourseCompleted(data: any) {
  const supabase = await createClient()
  
  try {
    const { error: enrollmentError } = await supabase
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
    
    const { error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: data.userId,
        course_id: data.courseId,
        issued_at: new Date().toISOString(),
        certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      })

    if (certError) {
      console.error('Error creating certificate:', certError)
    }
  } catch (err) {
    console.error('Unexpected error in handleCourseCompleted:', err)
  }
}
