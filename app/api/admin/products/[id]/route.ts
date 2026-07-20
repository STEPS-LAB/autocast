import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { bucket: 'admin:products:id:get', limit: 120, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const allowed = await isCurrentUserAdmin()
    if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

    const { id } = await context.params
    const productId = id?.trim()
    if (!productId) {
      return NextResponse.json({ error: 'Некоректний id товару.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const [
      { data: product, error: productError },
      { data: categories, error: categoriesError },
      { data: brands, error: brandsError },
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,video_urls,is_featured,created_at')
        .eq('id', productId)
        .maybeSingle(),
      supabase
        .from('categories')
        .select('id,slug,name_ua,parent_id,image_url,sort_order')
        .order('sort_order', { ascending: true }),
      supabase.from('brands').select('id,name,logo_url').order('name', { ascending: true }),
    ])

    if (productError) {
      const msg = String(productError.message ?? productError)
      if (msg.includes('video_urls')) {
        const retry = await supabase
          .from('products')
          .select('id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at')
          .eq('id', productId)
          .maybeSingle()
        if (retry.error) {
          return NextResponse.json({ error: retry.error.message }, { status: 500 })
        }
        if (!retry.data) {
          return NextResponse.json({ error: 'Товар не знайдено.' }, { status: 404 })
        }
        return NextResponse.json({
          product: { ...retry.data, video_urls: [] },
          categories: categories ?? [],
          brands: brands ?? [],
        })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Товар не знайдено.' }, { status: 404 })
    }

    const errorMessage = categoriesError?.message ?? brandsError?.message
    if (errorMessage) {
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({
      product,
      categories: categories ?? [],
      brands: brands ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити товар.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
