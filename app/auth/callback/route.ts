import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('🔐 Auth callback started')
  console.log('Code present:', !!code)
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
              console.log(`Cookie set: ${name}`)
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
              console.log(`Cookie removed: ${name}`)
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error)
            }
          },
        },
      }
    )
    
    console.log('Exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
    
    console.log('✅ Session exchanged successfully')
    
    // Verify session was set
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session after exchange:', session ? 'Present' : 'Missing')
    if (session) {
      console.log('User:', session.user.email)
    }
  }

  console.log('Redirecting to dashboard')
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
