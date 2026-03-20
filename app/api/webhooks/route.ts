import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Verify webhook signature (implement based on your webhook provider)
    const signature = request.headers.get('x-webhook-signature')
    // Add your signature verification logic here

    // Process different webhook events
    switch (body.event) {
      case 'user.created':
        // Handle user creation
        await handleUserCreated(body.data)
        break
      case 'payment.succeeded':
        // Handle successful payment
        await handlePaymentSucceeded(body.data)
        break
      default:
        console.log('Unhandled webhook event:', body.event)
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
  
  // Create user profile - with type assertion on the insert object
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: data.id,
      email: data.email,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)

  if (error) {
    console.error('Error creating user profile:', error)
  }
}

async function handlePaymentSucceeded(data: any) {
  const supabase = await createClient()
  
  // Update enrollment - with type assertion on the update object
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
