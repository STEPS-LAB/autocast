import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getSupabaseUrl } from '@/lib/supabase/env'

interface UploadBody {
  productId?: string
  dataUrl?: string
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  const mimeType = match[1]
  const base64 = match[2]
  if (!mimeType || !base64) return null
  return { mimeType, base64 }
}

function extensionFromMime(mimeType: string) {
  if (mimeType.includes('png')) return 'png'
  if (mimeType.includes('webp')) return 'webp'
  return 'jpg'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadBody
    const productId = body.productId?.trim()
    const dataUrl = body.dataUrl?.trim()

    if (!productId || !dataUrl) {
      return NextResponse.json({ error: 'Некоректні дані завантаження.' }, { status: 400 })
    }

    const parsed = parseDataUrl(dataUrl)
    if (!parsed) {
      return NextResponse.json({ error: 'Підтримуються лише зображення у форматі data URL.' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })
    }

    const supabaseUrl = getSupabaseUrl()
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase service role не налаштований.' }, { status: 500 })
    }

    const serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const bucketName = 'product-images'

    const { data: buckets } = await serviceClient.storage.listBuckets()
    const hasBucket = (buckets ?? []).some((bucket) => bucket.name === bucketName)
    if (!hasBucket) {
      const { error: createBucketError } = await serviceClient.storage.createBucket(bucketName, {
        public: true,
      })
      if (createBucketError && !/already exists/i.test(createBucketError.message)) {
        return NextResponse.json({ error: createBucketError.message }, { status: 500 })
      }
    }

    const bytes = Buffer.from(parsed.base64, 'base64')
    const extension = extensionFromMime(parsed.mimeType)
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

    const { error: uploadError } = await serviceClient.storage
      .from(bucketName)
      .upload(path, bytes, {
        upsert: true,
        contentType: parsed.mimeType,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicData } = serviceClient.storage.from(bucketName).getPublicUrl(path)
    return NextResponse.json({ publicUrl: publicData.publicUrl })
  } catch {
    return NextResponse.json({ error: 'Не вдалося завантажити зображення.' }, { status: 500 })
  }
}
