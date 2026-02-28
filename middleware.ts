import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔄 Middleware running for path:', request.nextUrl.pathname)
  
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  console.log('👤 Session exists:', !!session)

  const pathname = request.nextUrl.pathname

  // Public routes
  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')

  console.log('📍 Is public route:', isPublicRoute)

  // If logged in and trying to access login/register, go to dashboard
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    console.log('➡️ Redirecting to dashboard (logged in user on auth page)')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If not logged in and trying to access protected route, go to login
  if (!session && !isPublicRoute) {
    console.log('➡️ Redirecting to login (unauthenticated user on protected route)')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log('✅ No redirect needed')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
