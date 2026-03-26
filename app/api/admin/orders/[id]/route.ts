import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'

async function isCurrentUserAdmin() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role === 'admin'
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const rl = rateLimit(request, { bucket: 'admin:orders:id:get', limit: 120, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const allowed = await isCurrentUserAdmin()
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await ctx.params
    // Use service role to bypass RLS for admin details (orders join order_items/products).
    const supabase = await createServiceClient()
    let result: any = await supabase
      .from('orders')
      .select(`
          id,total,items_total,shipping_total,grand_total,ttn,status,created_at,shipping_info,
          order_items(
            id,qty,unit_price,
            product:products(id,slug,name_ua)
          )
        `)
      .eq('id', id)
      .maybeSingle()

    // Backwards-compatible fallback if DB migrations weren't applied yet.
    if (result.error && /column .*items_total|column .*shipping_total|column .*grand_total|column .*ttn/i.test(result.error.message)) {
      result = await supabase
        .from('orders')
        .select(`
            id,total,status,created_at,shipping_info,
            order_items(
              id,qty,unit_price,
              product:products(id,slug,name_ua)
            )
          `)
        .eq('id', id)
        .maybeSingle()
    }

    if (result.error) return NextResponse.json({ error: `Cannot load order: ${result.error.message}` }, { status: 500 })
    if (!result.data) return NextResponse.json({ order: null }, { status: 200 })

    return NextResponse.json({ order: result.data })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Cannot load order: ${message}` }, { status: 500 })
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const rl = rateLimit(request, { bucket: 'admin:orders:id:patch', limit: 60, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const allowed = await isCurrentUserAdmin()
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const schema = z.object({
      ttn: z.string().trim().min(1).max(80).nullable().optional(),
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    })

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const { id } = await ctx.params
    const patch = parsed.data
    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

    const supabase = await createServiceClient()
    const { error } = await supabase.from('orders').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: `Cannot update order: ${error.message}` }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Cannot update order: ${message}` }, { status: 500 })
  }
}

