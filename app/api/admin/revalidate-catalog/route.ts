import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateCatalogCache } from '@/lib/admin/revalidate-catalog'
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

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:revalidate-catalog', limit: 60, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  revalidateCatalogCache()
  return NextResponse.json({ ok: true })
}
