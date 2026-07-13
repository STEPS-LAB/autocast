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

export async function GET(request: Request) {
  try {
    const rl = rateLimit(request, { bucket: 'admin:products:get', limit: 60, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const allowed = await isCurrentUserAdmin()
    if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

    const supabase = await createServiceClient()
    const [
      { data: products, error: productsError },
      { data: categories, error: categoriesError },
      { data: brands, error: brandsError },
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at')
        .order('created_at', { ascending: false })
        .range(0, 4999),
      supabase
        .from('categories')
        .select('id,slug,name_ua,parent_id,image_url,sort_order')
        .order('sort_order', { ascending: true }),
      supabase.from('brands').select('id,name,logo_url').order('name', { ascending: true }),
    ])

    const errorMessage =
      productsError?.message ?? categoriesError?.message ?? brandsError?.message
    if (errorMessage) {
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({
      products: products ?? [],
      categories: categories ?? [],
      brands: brands ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити товари.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
