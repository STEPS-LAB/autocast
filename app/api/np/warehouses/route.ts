import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rateLimit'
import { getWarehousesByCityRef } from '@/lib/shipping/novaPoshta'

const querySchema = z.object({
  cityRef: z.string().trim().min(1, 'Оберіть місто'),
  query: z.string().trim().optional(),
  type: z.enum(['warehouse', 'postomat', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { bucket: 'np:warehouses', limit: 60, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const parsed = querySchema.safeParse({
    cityRef: request.nextUrl.searchParams.get('cityRef') ?? '',
    query: request.nextUrl.searchParams.get('query') ?? undefined,
    type: request.nextUrl.searchParams.get('type') ?? 'all',
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некоректні параметри пошуку відділення' }, { status: 400 })
  }

  try {
    const all = await getWarehousesByCityRef(
      parsed.data.cityRef,
      parsed.data.query,
      parsed.data.limit ?? 25
    )
    const suggestions = parsed.data.type === 'all'
      ? all
      : all.filter((item) => item.type === parsed.data.type)
    return NextResponse.json({ suggestions })
  } catch (e) {
    const msg = String((e as Error)?.message ?? '')
    if (msg.includes('NOVA_POSHTA_API_KEY')) {
      return NextResponse.json(
        { error: 'NOVA_POSHTA_API_KEY не налаштований. Додайте ключ Нової Пошти в env і перезапустіть dev сервер.' },
        { status: 500 }
      )
    }
    // Surface upstream error details in dev for easier setup/debugging.
    const isProd = process.env['NODE_ENV'] === 'production'
    return NextResponse.json(
      { error: isProd ? 'Не вдалося отримати список відділень НП' : `Не вдалося отримати список відділень НП: ${msg}` },
      { status: 502 }
    )
  }
}
