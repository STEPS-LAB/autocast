import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { resolveTorssenFeedUrl } from '@/lib/import/torssen/feeds'
import { buildTorssenImportPreview } from '@/lib/import/torssen/run-import'

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
export const maxDuration = 300

export async function POST(request: Request) {
  const rl = rateLimit(request, { bucket: 'admin:import-yml-preview', limit: 5, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let body: { feedId?: string; url?: string }
  try {
    body = (await request.json()) as { feedId?: string; url?: string }
  } catch {
    return NextResponse.json({ error: 'Очікується JSON з feedId або url.' }, { status: 400 })
  }

  try {
    const resolved = resolveTorssenFeedUrl(body)
    const preview = await buildTorssenImportPreview(resolved.url)
    return NextResponse.json({ ...preview, feedUrl: resolved.url, feedId: resolved.feedId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося зробити превʼю фіду.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
