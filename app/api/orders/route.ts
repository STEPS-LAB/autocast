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

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name_ua, price, sale_price, stock')
    .in('id', productIds)

  if (productsError) {
    return NextResponse.json({ error: 'Не вдалося перевірити товари' }, { status: 500 })
  }

  type ProductRow = {
    id: string
    name_ua: string
    price: unknown
    sale_price: unknown
    stock: number
  }

  const productsById = new Map<string, ProductRow>(
    (products ?? []).map((p) => [p.id, p as unknown as ProductRow]),
  )

  for (const item of normalizedItems) {
    const product = productsById.get(item.product_id)
    if (!product) {
      return NextResponse.json({ error: 'Деякі товари більше недоступні. Оновіть кошик.' }, { status: 409 })
    }

    const basePrice = toNumber(product.price)
    const salePrice = toNumber(product.sale_price)
    const currentUnitPrice = (salePrice ?? basePrice)
    if (currentUnitPrice === null) {
      return NextResponse.json({ error: 'Не вдалося визначити ціну товару. Спробуйте ще раз.' }, { status: 500 })
    }

    if (item.unit_price !== undefined) {
      const diff = Math.abs(item.unit_price - currentUnitPrice)
      if (diff > 0.009) {
        return NextResponse.json(
          { error: `Ціна товару «${product.name_ua}» змінилась до ${formatMoney(currentUnitPrice)}. Оновіть кошик і повторіть спробу.` },
          { status: 409 },
        )
      }
    }

    if (typeof product.stock !== 'number' || !Number.isFinite(product.stock)) {
      return NextResponse.json({ error: 'Не вдалося перевірити наявність товару. Спробуйте ще раз.' }, { status: 500 })
    }

    if (product.stock < item.qty) {
      return NextResponse.json(
        { error: `Недостатня кількість товару «${product.name_ua}». Доступно: ${product.stock} шт.` },
        { status: 409 },
      )
    }
  }

  const total = normalizedItems.reduce((sum, item) => {
    const p = productsById.get(item.product_id)!
    const basePrice = toNumber(p.price)
    const salePrice = toNumber(p.sale_price)
    const currentUnitPrice = (salePrice ?? basePrice) as number
    return sum + (currentUnitPrice * item.qty)
  }, 0)

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? null

  const db = userId ? supabase : await createServiceClient()

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      user_id: userId,
      total,
      status: 'pending',
      shipping_info,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Не вдалося створити замовлення' }, { status: 500 })
  }

  const orderItems = normalizedItems.map((item) => {
    const p = productsById.get(item.product_id)!
    const basePrice = toNumber(p.price)
    const salePrice = toNumber(p.sale_price)
    const currentUnitPrice = (salePrice ?? basePrice) as number
    return ({
    order_id: order.id,
    product_id: item.product_id,
    qty: item.qty,
    unit_price: currentUnitPrice,
    })
  })

  const { error: itemsError } = await db.from('order_items').insert(orderItems)
  if (itemsError) {
    return NextResponse.json({ error: 'Не вдалося зберегти товари замовлення' }, { status: 500 })
  }

  return NextResponse.json({
    id: order.id,
    number: order.id.slice(0, 8).toUpperCase(),
  })
}
