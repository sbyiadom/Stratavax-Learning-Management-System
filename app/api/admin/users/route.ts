import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    console.log('=== API Debug ===')
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth user:', user?.email)
    console.log('Auth error:', authError)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle()
    
    console.log('Profile found:', profile)
    console.log('Profile error:', profileError)
    console.log('User role from profile:', profile?.role)
    console.log('Is admin?', profile?.role === 'admin')
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        debug: { 
          userEmail: user.email,
          userRole: profile?.role,
          profileExists: !!profile
        }
      }, { status: 403 })
    }
    
    // Get all users from profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Users found:', users?.length)
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
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
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profile?.role !== 'admin') {
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
