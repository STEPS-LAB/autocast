import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BRANDS, CAR_MAKES, CAR_MODELS, CATEGORIES, PRODUCTS } from '@/lib/data/seed'

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

  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id,slug')
  const categoryIdBySlug = new Map((dbCategories ?? []).map((c) => [c.slug, c.id]))

  // Brands
  for (const brand of BRANDS) {
    await supabase.from('brands').upsert({
      name: brand.name,
      logo_url: brand.logo_url,
    }, { onConflict: 'name' })
  }

  const { data: dbBrands } = await supabase
    .from('brands')
    .select('id,name')
  const brandIdByName = new Map((dbBrands ?? []).map((b) => [b.name, b.id]))

  // Products
  for (const product of PRODUCTS) {
    const seedCategory = CATEGORIES.find((c) => c.id === product.category_id)
    const seedBrand = BRANDS.find((b) => b.id === product.brand_id)
    const categoryId = seedCategory ? categoryIdBySlug.get(seedCategory.slug) : undefined
    const brandId = seedBrand ? brandIdByName.get(seedBrand.name) : null
    if (!categoryId) continue

    await supabase.from('products').upsert({
      slug: product.slug,
      name_ua: product.name_ua,
      description_ua: product.description_ua,
      price: product.price,
      sale_price: product.sale_price,
      stock: product.stock,
      category_id: categoryId,
      brand_id: brandId ?? null,
      specs: product.specs ?? {},
      images: product.images ?? [],
      is_featured: product.is_featured,
    }, { onConflict: 'slug' })
  }

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
