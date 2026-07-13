import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { buildImportPreview } from '@/lib/import/drivex/run-import'

const MAX_FILE_BYTES = 50 * 1024 * 1024

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
  const rl = rateLimit(request, { bucket: 'admin:import-preview', limit: 10, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Не вдалося прочитати файл.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Оберіть Excel-файл (.xlsx).' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Підтримуються лише файли .xlsx.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Файл завеликий (макс. 50 МБ).' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const preview = await buildImportPreview(buffer)
    return NextResponse.json(preview)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося розібрати файл.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
