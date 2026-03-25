import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { z } from 'zod'

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
  const rl = rateLimit(request, { bucket: 'admin:users:get', limit: 60, windowMs: 60_000 })
  if (!rl.ok) return rl.response

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
  const rl = rateLimit(request, { bucket: 'admin:users:patch', limit: 30, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const patchSchema = z.object({
    id: z.string().uuid(),
    role: z.enum(['user', 'admin']),
  })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.id)

  if (error) {
    return NextResponse.json({ error: 'Cannot update role' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
