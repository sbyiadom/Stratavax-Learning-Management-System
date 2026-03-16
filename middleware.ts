import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser() instead of getSession() for better auth
  const { data: { user } } = await supabase.auth.getUser()
  
  const pathname = request.nextUrl.pathname

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isPublicRoute) {
    return supabaseResponse
  }

  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
