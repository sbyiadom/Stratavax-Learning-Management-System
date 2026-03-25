import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user - this will refresh the session if needed
  const { data: { user } } = await supabase.auth.getUser()
  
  const pathname = request.nextUrl.pathname

  // Define public routes
  const isPublicRoute = pathname === '/' || 
                        pathname === '/login' || 
                        pathname === '/register' || 
                        pathname === '/auth/callback'

  // If logged in and trying to access login/register, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!user && !isPublicRoute && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
