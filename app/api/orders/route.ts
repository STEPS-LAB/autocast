import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { shippingInfoSchema } from '@/lib/validators/checkout.schema'

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(value)
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
  const { data: created, error: createError } = await service.rpc('create_order_with_inventory', {
    p_user_id: userId,
    p_shipping_info: shipping_info,
    p_items: normalizedItems.map(i => ({ product_id: i.product_id, qty: i.qty })),
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
