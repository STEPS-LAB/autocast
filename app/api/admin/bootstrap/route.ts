import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BRANDS, CAR_MAKES, CAR_MODELS, CATEGORIES } from '@/lib/data/seed'

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

export async function POST() {
  const allowed = await isCurrentUserAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()

  // Categories
  for (const category of CATEGORIES) {
    await supabase.from('categories').upsert({
      slug: category.slug,
      name_ua: category.name_ua,
      parent_id: null,
      image_url: category.image_url,
      sort_order: category.sort_order,
    }, { onConflict: 'slug' })
  }

  // Brands
  for (const brand of BRANDS) {
    await supabase.from('brands').upsert({
      name: brand.name,
      logo_url: brand.logo_url,
    }, { onConflict: 'name' })
  }

  // Intentionally do NOT upsert seed products here.
  // Admin CRUD calls this route after each change; re-seeding PRODUCTS would
  // flood the catalog with demo items and undo a real-only shop.

  // Car makes/models
  for (const make of CAR_MAKES) {
    await supabase.from('car_makes').upsert({ name: make.name }, { onConflict: 'name' })
  }

  const { data: dbMakes } = await supabase.from('car_makes').select('id,name')
  const makeIdByName = new Map((dbMakes ?? []).map((m) => [m.name, m.id]))

  for (const make of CAR_MAKES) {
    const makeDbId = makeIdByName.get(make.name)
    if (!makeDbId) continue
    const models = CAR_MODELS[make.id] ?? []
    for (const model of models) {
      await supabase.from('car_models').upsert({
        make_id: makeDbId,
        name: model,
      }, { onConflict: 'make_id,name' })
    }
  }

  const [{ count: categoriesCount }, { count: brandsCount }, { count: productsCount }, { count: makesCount }, { count: modelsCount }] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('car_makes').select('*', { count: 'exact', head: true }),
    supabase.from('car_models').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    ok: true,
    stats: {
      categories: categoriesCount ?? 0,
      brands: brandsCount ?? 0,
      products: productsCount ?? 0,
      car_makes: makesCount ?? 0,
      car_models: modelsCount ?? 0,
    },
  })
}
