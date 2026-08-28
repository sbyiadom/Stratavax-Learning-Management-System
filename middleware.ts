import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static assets, API routes, and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Public routes
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

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!,
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

    const { data: { user } } = await supabase.auth.getUser()

    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/register-supervisor')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  } catch (error) {
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
