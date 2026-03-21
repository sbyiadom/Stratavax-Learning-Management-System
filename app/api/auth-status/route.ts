import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  
  // Log all cookies (without sensitive data)
  const allCookies = cookieStore.getAll().map(c => ({
    name: c.name,
    length: c.value.length,
    preview: c.value.substring(0, 20) + '...'
  }))

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
    cookies: allCookies,
    hasSession: !!session,
    session: session ? {
      user: session.user.email,
      expiresAt: new Date(session.expires_at! * 1000).toISOString()
    } : null
  })
}
