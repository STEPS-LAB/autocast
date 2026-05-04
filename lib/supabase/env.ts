const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimTrailingSlash(trimmed)
  }
  return trimTrailingSlash(`https://${trimmed}`)
}

export function getSupabaseUrl() {
  return (
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ??
    process.env['SUPABASE_URL'] ??
    null
  )
}

export function getSupabaseAnonKey() {
  return (
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ??
    process.env['SUPABASE_ANON_KEY'] ??
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ??
    process.env['SUPABASE_PUBLISHABLE_KEY'] ??
    null
  )
}

/**
 * Public site base URL for redirects, metadata, and auth email links.
 * With `request`, prefers `x-forwarded-*` over `request.url` so serverless
 * does not emit links using an internal localhost origin.
 */
export function getSiteUrl(request?: Request) {
  const configured =
    process.env['NEXT_PUBLIC_SITE_URL'] ?? process.env['SITE_URL']
  if (configured) {
    return normalizeBaseUrl(configured)
  }

  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    if (forwardedHost) {
      const host = forwardedHost.split(',')[0]?.trim()
      const proto =
        forwardedProto?.split(',')[0]?.trim().replace(/:$/, '') ?? 'https'
      if (host) return normalizeBaseUrl(`${proto}://${host}`)
    }
  }

  const vercelProduction = process.env['VERCEL_PROJECT_PRODUCTION_URL']
  if (vercelProduction) {
    return normalizeBaseUrl(vercelProduction)
  }

  const vercelUrl = process.env['VERCEL_URL']
  if (vercelUrl) return normalizeBaseUrl(`https://${vercelUrl}`)

  if (request) {
    try {
      const origin = new URL(request.url).origin
      if (origin && origin !== 'null') return trimTrailingSlash(origin)
    } catch {
      // ignore invalid request.url
    }
  }

  return 'http://localhost:3000'
}
