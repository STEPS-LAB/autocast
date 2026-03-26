import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { shippingInfoSchema } from '@/lib/validators/checkout.schema'
import { calculateShippingQuote } from '@/lib/shipping/calculateShipping'
import { validateNovaPoshtaWarehouseAddress } from '@/lib/shipping/novaPoshta'

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

const createOrderSchema = z.object({
  shipping_info: shippingInfoSchema,
  items: z.array(z.object({
    product_id: z.string().refine(isUuid, 'Некоректний товар у кошику'),
    qty: z.number().int().positive(),
    unit_price: z.number().optional(),
  })).min(1).max(50),
})

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'orders:create', limit: 10, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректне тіло запиту' }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Некоректні дані замовлення' }, { status: 400 })
  }

  const { shipping_info, items } = parsed.data
  const supabase = await createClient()

  const normalized = new Map<string, { product_id: string, qty: number, unit_price?: number }>()
  for (const item of items) {
    const existing = normalized.get(item.product_id)
    if (existing) {
      existing.qty += item.qty
    } else {
      normalized.set(item.product_id, {
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
      })
    }
  }

  const normalizedItems = [...normalized.values()]
  const productIds = normalizedItems.map(i => i.product_id)

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? null

  const service = await createServiceClient()

  // Compute items_total server-side based on current DB prices (same as RPC).
  const { data: products, error: productsError } = await service
    .from('products')
    .select('id,price,sale_price')
    .in('id', productIds)

  if (productsError || !products) {
    return NextResponse.json({ error: 'Не вдалося перевірити товари у кошику' }, { status: 500 })
  }

  const priceById = new Map<string, { price: number; sale_price: number | null }>()
  for (const p of products as any[]) {
    priceById.set(String(p.id), { price: Number(p.price), sale_price: p.sale_price === null ? null : Number(p.sale_price) })
  }

  for (const id of productIds) {
    if (!priceById.has(id)) {
      return NextResponse.json({ error: 'Деякі товари більше недоступні. Оновіть кошик.' }, { status: 409 })
    }
  }

  const itemsTotal = roundMoney(
    normalizedItems.reduce((sum, item) => {
      const p = priceById.get(item.product_id)!
      const unit = (p.sale_price ?? p.price)
      return sum + unit * item.qty
    }, 0)
  )

  // Validate shipping selection (Nova Poshta refs) and compute shipping_total server-side.
  let shippingTotal = 0
  if (shipping_info.delivery_method !== 'pickup') {
    if (shipping_info.delivery_method === 'nova_poshta') {
      const deliveryType = shipping_info.delivery_type ?? 'warehouse'

      if (deliveryType !== 'courier') {
        try {
          const point = await validateNovaPoshtaWarehouseAddress({
            cityRef: String(shipping_info.np_city_ref ?? ''),
            warehouseRef: String(shipping_info.np_point_ref ?? ''),
          })
          if (!point) {
            return NextResponse.json(
              { error: 'Некоректна адреса НП. Оберіть місто та відділення зі списку.' },
              { status: 422 }
            )
          }
        } catch {
          return NextResponse.json({ error: 'Не вдалося перевірити адресу Нової Пошти' }, { status: 502 })
        }
      }

      shippingTotal = calculateShippingQuote({
        items_total: itemsTotal,
        selection: {
          delivery_method: 'nova_poshta',
          delivery_type: deliveryType,
          np_city_ref: shipping_info.np_city_ref,
          np_city_name: shipping_info.np_city_name,
          np_point_ref: shipping_info.np_point_ref,
          np_point_name: shipping_info.np_point_name,
          payment_method: shipping_info.payment_method,
          city: shipping_info.city,
          address: shipping_info.address,
        } as any,
      } as any).shipping_total
    } else {
      shippingTotal = calculateShippingQuote({
        items_total: itemsTotal,
        selection: {
          delivery_method: shipping_info.delivery_method,
          delivery_type: 'warehouse',
          payment_method: shipping_info.payment_method,
          city: shipping_info.city,
          address: shipping_info.address,
        } as any,
      } as any).shipping_total
    }
  }

  const { data: created, error: createError } = await service.rpc('create_order_with_inventory', {
    p_user_id: userId,
    p_shipping_info: shipping_info,
    p_items: normalizedItems.map(i => ({ product_id: i.product_id, qty: i.qty })),
    p_shipping_total: shippingTotal,
  })

  if (createError || !created) {
    const msg = String(createError?.message ?? '')
    if (msg.includes('OUT_OF_STOCK:')) {
      return NextResponse.json({ error: 'Недостатня кількість деяких товарів. Оновіть кошик.' }, { status: 409 })
    }
    if (msg.includes('PRODUCT_NOT_FOUND')) {
      return NextResponse.json({ error: 'Деякі товари більше недоступні. Оновіть кошик.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Не вдалося створити замовлення' }, { status: 500 })
  }

  const orderId = String(created)

  return NextResponse.json({
    id: orderId,
    number: orderId.slice(0, 8).toUpperCase(),
  })
}
