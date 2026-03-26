import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rateLimit'
import { searchCities } from '@/lib/shipping/novaPoshta'

const querySchema = z.object({
  query: z.string().trim().min(2, 'Введіть щонайменше 2 символи'),
  limit: z.coerce.number().int().min(1).max(20).optional(),
})

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { bucket: 'np:cities', limit: 60, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const parsed = querySchema.safeParse({
    query: request.nextUrl.searchParams.get('query') ?? '',
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некоректні параметри пошуку міста' }, { status: 400 })
  }

  try {
    const suggestions = await searchCities(parsed.data.query, parsed.data.limit ?? 10)
    return NextResponse.json({ suggestions })
  } catch (e) {
    const msg = String((e as Error)?.message ?? '')
    if (msg.includes('NOVA_POSHTA_API_KEY')) {
      return NextResponse.json(
        { error: 'NOVA_POSHTA_API_KEY не налаштований. Додайте ключ Нової Пошти в env і перезапустіть dev сервер.' },
        { status: 500 }
      )
    }
    const isProd = process.env['NODE_ENV'] === 'production'
    return NextResponse.json(
      { error: isProd ? 'Не вдалося отримати список міст НП' : `Не вдалося отримати список міст НП: ${msg}` },
      { status: 502 }
    )
  }
}
