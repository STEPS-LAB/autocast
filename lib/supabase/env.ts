const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

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

export function getSiteUrl() {
  const fromEnv =
    process.env['NEXT_PUBLIC_SITE_URL'] ??
    process.env['SITE_URL'] ??
    process.env['VERCEL_PROJECT_PRODUCTION_URL']

  if (fromEnv) {
    const normalized = fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`
    return trimTrailingSlash(normalized)
  }

  const vercelUrl = process.env['VERCEL_URL']
  if (vercelUrl) return trimTrailingSlash(`https://${vercelUrl}`)

  return 'http://localhost:3000'
}
