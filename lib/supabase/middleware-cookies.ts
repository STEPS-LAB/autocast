import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { combineChunks, stringFromBase64URL } from '@supabase/ssr'

const BASE64_PREFIX = 'base64-'

/** Same hostname rule as @supabase/supabase-js default auth cookie name. */
export function getAuthCookieStorageKey(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname
  const ref = hostname.split('.')[0] ?? hostname
  return `sb-${ref}-auth-token`
}

/**
 * Reads the Supabase session user from request cookies only — no Auth API or
 * refresh calls. Used in Edge middleware to avoid Vercel
 * MIDDLEWARE_INVOCATION_TIMEOUT when tokens are expired (getSession() would
 * block on refresh). Token refresh happens in Server Components / route
 * handlers via createClient().
 */
export async function getSessionUserFromCookies(
  request: NextRequest,
  supabaseUrl: string
): Promise<User | null> {
  const storageKey = getAuthCookieStorageKey(supabaseUrl)
  const cookieMap = new Map(request.cookies.getAll().map((c) => [c.name, c.value]))

  const retrieveChunk = async (name: string): Promise<string | null> =>
    cookieMap.get(name) ?? null

  const raw = await combineChunks(storageKey, retrieveChunk)
  if (!raw) return null

  let decoded = raw
  if (raw.startsWith(BASE64_PREFIX)) {
    decoded = stringFromBase64URL(raw.slice(BASE64_PREFIX.length))
  }

  let session: { expires_at?: number; user?: User | null }
  try {
    session = JSON.parse(decoded) as { expires_at?: number; user?: User | null }
  } catch {
    return null
  }

  if (!session?.user?.id) return null

  const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0
  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    return null
  }

  return session.user
}
