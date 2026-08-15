import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { buildExcelImportPreview } from '@/lib/import/excel/run-import'
import { downloadExcelImportBuffer } from '@/lib/import/excel/storage'

export const runtime = 'nodejs'
export const maxDuration = 300

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
  const rl = rateLimit(request, { bucket: 'admin:import-preview', limit: 10, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let path = ''
  try {
    const body = (await request.json()) as { path?: string }
    path = (body.path ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Некоректний запит.' }, { status: 400 })
  }

  try {
    const service = createServiceClient()
    const buffer = await downloadExcelImportBuffer(service, path)
    const preview = await buildExcelImportPreview(buffer)
    return NextResponse.json(preview)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося розібрати файл.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
