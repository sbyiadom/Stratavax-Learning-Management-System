import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log('=================================')
  console.log('🔍 MIDDLEWARE DEBUG - Path:', pathname)
  console.log('🕒 Time:', new Date().toISOString())

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)?.value
          console.log(`🍪 Cookie GET ${name}:`, cookie ? 'exists' : 'missing')
          return cookie
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`🍪 Cookie SET ${name}:`, value.substring(0, 20) + '...')
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          console.log(`🍪 Cookie REMOVE ${name}`)
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()
  
  console.log('👤 Session:', session ? {
    id: session.user.id.substring(0, 8) + '...',
    email: session.user.email,
  } : 'No session')
  
  if (error) {
    console.log('❌ Session error:', error.message)
  }

  // Define routes
  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  console.log('📍 Route classification:', {
    path: pathname,
    isPublic: isPublicRoute,
    isAuth: isAuthRoute,
    hasSession: !!session
  })

  // Handle redirects
  if (session && isAuthRoute) {
    console.log('➡️ REDIRECT: Authenticated user on auth page -> /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && !isPublicRoute) {
    console.log('➡️ REDIRECT: Unauthenticated user on protected page -> /login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('✅ NO REDIRECT - serving page')
  console.log('=================================')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
