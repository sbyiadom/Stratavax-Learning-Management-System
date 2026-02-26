import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    // Fixed: Added await
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formId = params.formId
    
    // Fetch form integration details from database
    const { data: integration, error } = await supabase
      .from('microsoft_form_integrations')
      .select('*')
      .eq('form_id', formId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Form integration not found' },
        { status: 404 }
      )
    }

    // Here you would typically call Microsoft Forms API
    // For now, return the stored integration data
    return NextResponse.json({ 
      integration,
      formId,
      message: 'Microsoft Forms integration data retrieved'
    })

  } catch (error) {
    console.error('Microsoft Forms API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    // Fixed: Added await
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formId = params.formId
    const body = await request.json()

    // Store or update form integration
    const { data: integration, error } = await supabase
      .from('microsoft_form_integrations')
      .upsert({
        form_id: formId,
        user_id: user.id,
        form_name: body.formName,
        access_token: body.accessToken, // In production, encrypt this
        refresh_token: body.refreshToken, // In production, encrypt this
        expires_at: body.expiresAt,
        settings: body.settings || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save form integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      integration,
      message: 'Form integration saved successfully'
    })

  } catch (error) {
    console.error('Microsoft Forms API error:', error)
    return NextResponse.json(
      { error: 'Failed to save form data' },
      { status: 500 }
    )
  }
}
