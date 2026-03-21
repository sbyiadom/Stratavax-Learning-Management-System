import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch form data
    const { data: form, error } = await supabaseServer
      .from('microsoft_forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (error) {
      console.error('Error fetching form:', error)
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error in form fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
