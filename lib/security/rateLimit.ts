import { NextResponse } from 'next/server'

type RateLimitOptions = {
  /** Unique name for the bucket, e.g. "auth:login" */
  bucket: string
  /** Max requests per window */
  limit: number
  /** Window size in ms */
  windowMs: number
}

type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

type BucketState = {
  resetAt: number
  count: number
}

const store = new Map<string, BucketState>()

function getClientIp(request: Request): string {
  // Prefer standard proxy headers; fall back to "unknown".
  const xf = request.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]!.trim()
  const xr = request.headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}

function getClientUa(request: Request): string {
  return request.headers.get('user-agent')?.slice(0, 200) ?? 'unknown'
}

/**
 * Best-effort rate limiting (in-memory).
 * Note: In serverless environments this is per-instance.
 */
export function rateLimit(request: Request, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const ip = getClientIp(request)
  const ua = getClientUa(request)

  const key = `${opts.bucket}:${ip}:${ua}`
  const state = store.get(key)

  if (!state || now >= state.resetAt) {
    store.set(key, { resetAt: now + opts.windowMs, count: 1 })
    return { ok: true }
  }

  state.count += 1
  if (state.count <= opts.limit) return { ok: true }

  const retryAfterSec = Math.max(1, Math.ceil((state.resetAt - now) / 1000))
  const response = NextResponse.json(
    { error: 'Занадто багато запитів. Спробуйте пізніше.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
      },
    },
  )
  return { ok: false, response }
}

