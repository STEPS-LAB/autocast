import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateOrderBody {
  shipping_info: Record<string, unknown>
  items: Array<{
    product_id: string
    qty: number
    unit_price?: number
  }>
}

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

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json() as CreateOrderBody
  const items = body.items ?? []

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Кошик порожній' }, { status: 400 })
  }

  const normalized = new Map<string, { product_id: string, qty: number, unit_price?: number }>()
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'Некоректні дані кошика' }, { status: 400 })
    }

    if (typeof item.product_id !== 'string' || !isUuid(item.product_id)) {
      return NextResponse.json({ error: 'Некоректний товар у кошику' }, { status: 400 })
    }

    const qty = toNumber(item.qty)
    if (qty === null || !Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Некоректна кількість товару' }, { status: 400 })
    }

    const existing = normalized.get(item.product_id)
    if (existing) {
      existing.qty += qty
    } else {
      normalized.set(item.product_id, {
        product_id: item.product_id,
        qty,
        unit_price: toNumber(item.unit_price ?? null) ?? undefined,
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

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total,
      status: 'pending',
      shipping_info: body.shipping_info ?? {},
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

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) {
    return NextResponse.json({ error: 'Не вдалося зберегти товари замовлення' }, { status: 500 })
  }

  return NextResponse.json({
    id: order.id,
    number: order.id.slice(0, 8).toUpperCase(),
  })
}
