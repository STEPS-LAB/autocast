import { NextResponse, type NextRequest } from 'next/server'
import { getSessionUserFromCookies } from './middleware-cookies'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl()

  // Skip auth middleware if Supabase isn't configured
  if (!supabaseUrl || !getSupabaseAnonKey()) {
    return NextResponse.next({ request })
  }

  // Do not use createServerClient + auth.getSession()/getUser() here: both can
  // trigger token refresh over the network on Edge and cause
  // MIDDLEWARE_INVOCATION_TIMEOUT. Cookie-only read is synchronous I/O only.
  const user = await getSessionUserFromCookies(request, supabaseUrl)

  // Protect auth pages (redirect logged-in users away)
  const authPaths = ['/login', '/register', '/forgot-password']
  const isAuthPath = authPaths.some(p => request.nextUrl.pathname.startsWith(p))
  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Protect account page
  if (!user && request.nextUrl.pathname.startsWith('/account')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin UI: require a non-expired session cookie. Role check in app/admin/layout.tsx.
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
