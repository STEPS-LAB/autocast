import { NextResponse } from 'next/server'
import { revalidateCatalogCache } from '@/lib/admin/revalidate-catalog'

export const runtime = 'nodejs'

function isAuthorized(request: Request): boolean {
  const secret = process.env['CRON_SECRET']?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}

/** Lightweight cache bust after Caralarm (or other) sync from GitHub Actions. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Revalidate failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
