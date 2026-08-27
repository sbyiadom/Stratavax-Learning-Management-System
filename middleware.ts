import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ============================================================
  // 1. SKIP: Static assets, images, and API routes
  // ============================================================
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next()
  }

  // ============================================================
  // 2. PUBLIC ROUTES (no auth required)
  // ============================================================
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/register-supervisor',
    '/auth/callback',
    '/login-debug',
    '/login-simple',
    '/login-test',
    '/test-login',
    '/test-session',
    '/dashboard-debug',
    '/dashboard-no-auth',
    '/debug',
  ]
  
  if (publicRoutes.includes(pathname)) {
    // If logged in and trying to access login/register, redirect to dashboard
    // We'll check this below after we get the user
  }

  // ============================================================
  // 3. PROTECTED ROUTES - Check auth
  // ============================================================
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in and trying to access login/register, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/register' || pathname === '/register-supervisor')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!user && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/register-supervisor',
    '/auth/callback',
    '/login-debug',
    '/login-simple',
    '/login-test',
    '/test-login',
    '/test-session',
    '/dashboard-debug',
    '/dashboard-no-auth',
    '/debug',
    '/dashboard/:path*',
    '/admin/:path*',
    '/learn/:path*',
    '/courses/:path*',
    '/certificates/:path*',
    '/discussions/:path*',
    '/profile/:path*',
    '/progress/:path*',
    '/settings/:path*',
    '/evaluation/:path*',
    '/evaluation-reports/:path*',
    '/training/:path*',
    '/explore/:path*',
    '/community/:path*',
    '/assignments/:path*',
    '/reports/:path*',
    '/instructor/:path*',
    '/manager/:path*',
    '/supervisors/:path*',
    '/users/:path*',
    '/assessments/:path*',
  ],
}
