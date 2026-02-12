import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Auth routes - redirect to dashboard if already logged in
  if (req.nextUrl.pathname.startsWith('/login') || 
      req.nextUrl.pathname.startsWith('/register')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Dashboard routes - redirect to login if not authenticated
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // API routes - check authentication for protected endpoints
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Skip auth check for public API endpoints
    const publicPaths = ['/api/auth', '/api/webhooks']
    const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))
    
    if (!isPublicPath && !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/api/:path*',
  ],
}
