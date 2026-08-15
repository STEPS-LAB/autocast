import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import {
  EXCEL_IMPORT_BUCKET,
  MAX_EXCEL_FILE_BYTES,
} from '@/lib/import/excel/storage'

export const runtime = 'nodejs'

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
  const rl = rateLimit(request, { bucket: 'admin:import-upload-url', limit: 20, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

  let body: { fileName?: string; fileSize?: number }
  try {
    body = (await request.json()) as { fileName?: string; fileSize?: number }
  } catch {
    return NextResponse.json({ error: 'Некоректний запит.' }, { status: 400 })
  }

  const fileName = (body.fileName ?? '').trim()
  const fileSize = Number(body.fileSize)
  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Підтримуються лише файли .xlsx.' }, { status: 400 })
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: 'Невірний розмір файлу.' }, { status: 400 })
  }
  if (fileSize > MAX_EXCEL_FILE_BYTES) {
    return NextResponse.json({ error: 'Файл завеликий (макс. 50 МБ).' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: buckets } = await service.storage.listBuckets()
  const hasBucket = (buckets ?? []).some(bucket => bucket.name === EXCEL_IMPORT_BUCKET)
  if (!hasBucket) {
    const { error: createError } = await service.storage.createBucket(EXCEL_IMPORT_BUCKET, {
      public: true,
      fileSizeLimit: '100MB',
    })
    if (createError && !/already exists/i.test(createError.message)) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
  } else {
    await service.storage.updateBucket(EXCEL_IMPORT_BUCKET, {
      public: true,
      fileSizeLimit: '100MB',
    })
  }

  const path = `imports/${crypto.randomUUID()}.xlsx`
  const { data, error } = await service.storage
    .from(EXCEL_IMPORT_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data?.token || !data.path) {
    return NextResponse.json(
      { error: error?.message ?? 'Не вдалося підготувати завантаження.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ path: data.path, token: data.token })
}
