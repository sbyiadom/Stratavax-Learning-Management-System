import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  const cookieStore = await cookies()
  
  // Get all cookies
  const allCookies = cookieStore.getAll()
  
  // Try to get the session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  
  return NextResponse.json({
    cookies: allCookies.map(c => ({ 
      name: c.name, 
      value: c.value ? c.value.substring(0, 20) + '...' : null 
    })),
    hasSession: !!session,
    session: session ? {
      user: session.user.email,
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    } : null
  })
}
