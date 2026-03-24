import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

export async function GET() {
  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const service = await createServiceClient()

  const [{ data: profiles }, usersResult, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('id,role,created_at'),
    service.auth.admin.listUsers(),
    supabase.from('orders').select('id,user_id'),
  ])

  const ordersByUser = new Map<string, number>()
  ;(orders ?? []).forEach((order) => {
    if (!order.user_id) return
    ordersByUser.set(order.user_id, (ordersByUser.get(order.user_id) ?? 0) + 1)
  })

  const emailByUser = new Map<string, string>()
  usersResult.data.users.forEach((user) => {
    if (user.email) emailByUser.set(user.id, user.email)
  })

  const users = (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: emailByUser.get(profile.id) ?? '—',
    role: profile.role,
    orders: ordersByUser.get(profile.id) ?? 0,
    joined: profile.created_at,
  }))

  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { id?: string; role?: 'user' | 'admin' }
  if (!body.id || !body.role) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: body.role })
    .eq('id', body.id)

  if (error) {
    return NextResponse.json({ error: 'Cannot update role' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
