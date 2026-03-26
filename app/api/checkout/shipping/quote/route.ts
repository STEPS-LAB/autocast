import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { shippingQuoteRequestSchema } from '@/lib/validators/shipping.schema'
import { calculateShippingQuote } from '@/lib/shipping/calculateShipping'
import { getNovaPoshtaDocumentPrice, validateNovaPoshtaWarehouseAddress } from '@/lib/shipping/novaPoshta'

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { bucket: 'checkout:shipping:quote', limit: 30, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректне тіло запиту' }, { status: 400 })
  }

  const parsed = shippingQuoteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некоректні дані для розрахунку доставки' }, { status: 400 })
  }

  const { items_total, selection } = parsed.data

  if (selection.delivery_method === 'nova_poshta' && selection.delivery_type !== 'courier') {
    try {
      const point = await validateNovaPoshtaWarehouseAddress({
        cityRef: selection.np_city_ref!,
        warehouseRef: selection.np_point_ref!,
      })
      if (!point) {
        return NextResponse.json(
          { error: 'Некоректна адреса НП: відділення не знайдено для обраного міста' },
          { status: 422 }
        )
      }
    } catch (e) {
      const msg = String((e as Error)?.message ?? '')
      const isProd = process.env['NODE_ENV'] === 'production'
      return NextResponse.json(
        { error: isProd ? 'Помилка перевірки адреси НП' : `Помилка перевірки адреси НП: ${msg}` },
        { status: 502 }
      )
    }
  }

  // Prefer real Nova Poshta tariff calculation when configured.
  let quote = calculateShippingQuote({ items_total, selection })
  if (selection.delivery_method === 'nova_poshta') {
    const senderCityRef = process.env['NOVA_POSHTA_SENDER_CITY_REF'] ?? ''
    if (senderCityRef.trim()) {
      try {
        const serviceType: 'WarehouseWarehouse' | 'WarehouseDoors' | 'DoorsWarehouse' | 'DoorsDoors' =
          selection.delivery_type === 'courier' ? 'WarehouseDoors' : 'WarehouseWarehouse'

        const price = await getNovaPoshtaDocumentPrice({
          citySenderRef: senderCityRef,
          cityRecipientRef: selection.np_city_ref!,
          serviceType,
          weight: 1,
          cost: Number(items_total),
          seatsAmount: 1,
        })

        quote = {
          ...quote,
          shipping_total: Number.isFinite(price.cost) ? price.cost : quote.shipping_total,
          rule_code: 'np_tariff',
          label: 'Нова Пошта (тариф НП)',
        }
      } catch (e) {
        const msg = String((e as Error)?.message ?? '')
        const isProd = process.env['NODE_ENV'] === 'production'
        // keep fallback quote but surface reason in dev
        if (!isProd) {
          return NextResponse.json({ error: `Помилка тарифу НП: ${msg}` }, { status: 502 })
        }
      }
    }
  }

  return NextResponse.json({
    quote,
    normalized_selection: selection,
  })
}
