import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
  try {
    const rl = rateLimit(request, { bucket: 'admin:orders:get', limit: 60, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const allowed = await isCurrentUserAdmin()
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Use service role to bypass RLS for admin views (orders join order_items).
    const supabase = await createServiceClient()
    let result: any = await supabase
      .from('orders')
      .select('id,total,ttn,status,created_at,shipping_info,order_items(id)')
      .order('created_at', { ascending: false })

    // Backwards-compatible fallback if DB migrations weren't applied yet.
    if (result.error && /column .*ttn/i.test(result.error.message)) {
      result = await supabase
        .from('orders')
        .select('id,total,status,created_at,shipping_info,order_items(id)')
        .order('created_at', { ascending: false })
    }

    if (result.error) {
      return NextResponse.json({ error: `Cannot load orders: ${result.error.message}` }, { status: 500 })
    }

    const orders = (result.data ?? []).map((row: any) => {
      const shipping = (row.shipping_info ?? {}) as Record<string, string>
      const firstName = shipping.first_name ?? ''
      const lastName = shipping.last_name ?? ''
      return {
        id: row.id,
        customer: `${firstName} ${lastName}`.trim() || 'Клієнт',
        email: shipping.email ?? '—',
        total: Number(row.total),
        ttn: (row as any).ttn ?? null,
        status: row.status,
        date: row.created_at,
        items: Array.isArray((row as any).order_items) ? (row as any).order_items.length : 0,
      }
    })

    return NextResponse.json({ orders })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Cannot load orders: ${message}` }, { status: 500 })
  }
}

