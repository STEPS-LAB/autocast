import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { NextResponse } from 'next/server'

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

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:import-caralarm', limit: 2, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  return NextResponse.json({ error: 'Синхронізацію Caralarm вимкнено.' }, { status: 410 })
}
