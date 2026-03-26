import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { shippingSelectionSchema } from '@/lib/validators/shipping.schema'
import { validateNovaPoshtaWarehouseAddress } from '@/lib/shipping/novaPoshta'

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { bucket: 'checkout:shipping:validate', limit: 30, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректне тіло запиту' }, { status: 400 })
  }

  const parsed = shippingSelectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некоректні дані доставки' }, { status: 400 })
  }

  const selection = parsed.data
  if (selection.delivery_method !== 'nova_poshta' || selection.delivery_type === 'courier') {
    return NextResponse.json({ valid: true, normalized: selection })
  }

  try {
    const point = await validateNovaPoshtaWarehouseAddress({
      cityRef: selection.np_city_ref!,
      warehouseRef: selection.np_point_ref!,
    })
    if (!point) {
      return NextResponse.json(
        { valid: false, error: 'Відділення не належить обраному місту або не існує' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      valid: true,
      normalized: {
        ...selection,
        np_point_name: selection.np_point_name ?? point.name,
      },
    })
  } catch (e) {
    const msg = String((e as Error)?.message ?? '')
    const isProd = process.env['NODE_ENV'] === 'production'
    return NextResponse.json(
      { error: isProd ? 'Помилка валідації адреси НП' : `Помилка валідації адреси НП: ${msg}` },
      { status: 502 }
    )
  }
}
