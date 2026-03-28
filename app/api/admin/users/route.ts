import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API /api/admin/users called ===')
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth getUser result:', { user: user?.email, error: authError?.message })
    
    if (authError || !user) {
      console.log('Auth failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('User email:', user.email)
    console.log('User ID:', user.id)
    
    // Hardcoded admin check for your email
    const ADMIN_EMAILS = ['sbyiadom88@gmail.com']
    const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email || '')
    
    console.log('Is hardcoded admin?', isHardcodedAdmin)
    
    let isAdmin = isHardcodedAdmin
    
    // If not hardcoded admin, check profile
    if (!isHardcodedAdmin) {
      console.log('Checking profile for admin role...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      console.log('Profile result:', profile, profileError)
      
      if (profile?.role === 'admin') {
        isAdmin = true
        console.log('User is admin from profile')
      } else {
        console.log('User is not admin. Role:', profile?.role)
      }
    }
    
    if (!isAdmin) {
      console.log('Access denied - not admin')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('Admin access granted, fetching all users...')
    
    // Get all users from profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    console.log(`Successfully fetched ${users?.length || 0} users`)
    
    return NextResponse.json({ success: true, users })
    
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, role } = body
    
    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const ADMIN_EMAILS = ['sbyiadom88@gmail.com']
    const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email || '')
    
    let isAdmin = isHardcodedAdmin
    
    if (!isHardcodedAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      isAdmin = profile?.role === 'admin'
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, user: updatedUser })
    
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
