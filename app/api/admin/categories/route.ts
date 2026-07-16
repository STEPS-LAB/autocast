import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { fetchAllCategories } from '@/lib/data/categories'

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
  const rl = rateLimit(request, { bucket: 'admin:categories:get', limit: 60, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  try {
    const supabase = await createServiceClient()
    const { data, error } = await fetchAllCategories(supabase)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ categories: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити категорії.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
