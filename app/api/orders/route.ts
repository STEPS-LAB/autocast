import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateOrderBody {
  shipping_info: Record<string, unknown>
  items: Array<{
    product_id: string
    qty: number
    unit_price: number
  }>
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json() as CreateOrderBody
  const items = body.items ?? []

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Кошик порожній' }, { status: 400 })
  }

  const total = items.reduce((sum, item) => sum + (item.unit_price * item.qty), 0)
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

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    qty: item.qty,
    unit_price: item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) {
    return NextResponse.json({ error: 'Не вдалося зберегти товари замовлення' }, { status: 500 })
  }

  return NextResponse.json({
    id: order.id,
    number: order.id.slice(0, 8).toUpperCase(),
  })
}
