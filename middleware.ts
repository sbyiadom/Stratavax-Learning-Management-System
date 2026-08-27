import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ============================================================
  // 1. IMMEDIATELY SKIP: Static assets, images, API routes, and files
  // ============================================================
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.includes('.') // Any file with extension
  ) {
    return NextResponse.next()
  }

  // ============================================================
  // 2. PUBLIC ROUTES (completely skip auth check)
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
    '/not-found',
  ]
  
  // If it's a public route, skip auth check entirely
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // ============================================================
  // 3. PROTECTED ROUTES - Only check auth for these
  // ============================================================
  try {
    const response = NextResponse.next({
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

    // If user is logged in and trying to access login/register, redirect to dashboard
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/register-supervisor')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If no user and trying to access protected route, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  } catch (error) {
    // If any error occurs in middleware, redirect to login instead of crashing
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/register-supervisor',
    '/auth/callback',
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
