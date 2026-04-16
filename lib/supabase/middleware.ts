import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl()
  const supabaseKey = getSupabaseAnonKey()

  // Skip auth middleware if Supabase isn't configured
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // getUser() hits the Auth API on every request and often exceeds Vercel Edge
  // middleware limits (504 MIDDLEWARE_INVOCATION_TIMEOUT). getSession() reads
  // the session from cookies so the middleware stays fast; admin role is
  // enforced again in app/admin/layout.tsx via getUser().
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Protect auth pages (redirect logged-in users away)
  const authPaths = ['/login', '/register']
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

  // Admin UI: require login in middleware (fast). Role check runs on the server
  // in app/admin/layout.tsx to avoid an extra PostgREST round trip on Edge.
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
