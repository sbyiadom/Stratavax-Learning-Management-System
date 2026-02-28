// In middleware.ts, make sure the protected route check includes '/dashboard/*'
const isPublicRoute = 
  request.nextUrl.pathname.startsWith('/login') ||
  request.nextUrl.pathname.startsWith('/register') ||
  request.nextUrl.pathname.startsWith('/auth/callback') ||
  request.nextUrl.pathname === '/' ||
  request.nextUrl.pathname.startsWith('/api/webhooks') ||
  request.nextUrl.pathname.startsWith('/_next') ||
  request.nextUrl.pathname.includes('.')

// Protected routes check (should include /dashboard)
if (!isPublicRoute && !session) {
  // This will catch /dashboard/* and any other non-public routes
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}
