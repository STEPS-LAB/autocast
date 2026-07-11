import { NextResponse } from 'next/server'
import { getUsdRate } from '@/lib/currency/rate'
import { rateLimit } from '@/lib/security/rateLimit'

export async function GET(request: Request) {
  const rl = rateLimit(request, { bucket: 'currency:rate', limit: 60, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const result = await getUsdRate()

  return NextResponse.json({
    rate: result.rate,
    source: 'source' in result ? result.source : 'nbu',
    fetchedAt: result.fetchedAt,
  })
}
