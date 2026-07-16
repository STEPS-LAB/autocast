import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { ADMIN_PRODUCTS_PAGE_SIZE, clampPage, getTotalPages } from '@/lib/pagination'
import {
  ADMIN_PRODUCT_SORT_OPTIONS,
  DEFAULT_ADMIN_PRODUCT_SORT,
  parseProductSortKey,
  type ProductSortKey,
} from '@/lib/product-sort'

const PRODUCT_SELECT = `
  id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
  category:categories(id,name_ua),
  brand:brands(id,name)
`

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

function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_,.()"'\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function sortOrder(sort: ProductSortKey): { column: string; ascending: boolean } {
  switch (sort) {
    case 'oldest':
      return { column: 'created_at', ascending: true }
    case 'name_asc':
      return { column: 'name_ua', ascending: true }
    case 'name_desc':
      return { column: 'name_ua', ascending: false }
    case 'price_asc':
      return { column: 'price', ascending: true }
    case 'price_desc':
      return { column: 'price', ascending: false }
    case 'stock_asc':
      return { column: 'stock', ascending: true }
    case 'stock_desc':
      return { column: 'stock', ascending: false }
    case 'newest':
    default:
      return { column: 'created_at', ascending: false }
  }
}

export async function GET(request: Request) {
  try {
    const rl = rateLimit(request, { bucket: 'admin:products:get', limit: 120, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const allowed = await isCurrentUserAdmin()
    if (!allowed) return NextResponse.json({ error: 'Доступ заборонено.' }, { status: 403 })

    const url = new URL(request.url)
    const pageSizeRaw = Number(url.searchParams.get('pageSize') ?? ADMIN_PRODUCTS_PAGE_SIZE)
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(50, Math.floor(pageSizeRaw))
        : ADMIN_PRODUCTS_PAGE_SIZE
    const requestedPage = Number(url.searchParams.get('page') ?? 1)
    const q = sanitizeSearch(url.searchParams.get('q') ?? '')
    const sort = parseProductSortKey(
      url.searchParams.get('sort'),
      ADMIN_PRODUCT_SORT_OPTIONS,
      DEFAULT_ADMIN_PRODUCT_SORT
    )
    const { column, ascending } = sortOrder(sort)

    const supabase = await createServiceClient()

    let categoryIds: string[] = []
    let brandIds: string[] = []
    if (q) {
      const [{ data: matchedCategories }, { data: matchedBrands }] = await Promise.all([
        supabase.from('categories').select('id').ilike('name_ua', `%${q}%`).limit(100),
        supabase.from('brands').select('id').ilike('name', `%${q}%`).limit(100),
      ])
      categoryIds = (matchedCategories ?? []).map(row => row.id)
      brandIds = (matchedBrands ?? []).map(row => row.id)
    }

    let countQuery = supabase.from('products').select('id', { count: 'exact', head: true })

    let dataQuery = supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .order(column, { ascending })
      .order('id', { ascending: true })

    if (q) {
      const filters = [
        `name_ua.ilike.%${q}%`,
        `description_ua.ilike.%${q}%`,
        `slug.ilike.%${q}%`,
      ]
      if (categoryIds.length > 0) {
        filters.push(`category_id.in.(${categoryIds.join(',')})`)
      }
      if (brandIds.length > 0) {
        filters.push(`brand_id.in.(${brandIds.join(',')})`)
      }
      const orFilter = filters.join(',')
      countQuery = countQuery.or(orFilter)
      dataQuery = dataQuery.or(orFilter)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const total = Number(count ?? 0)
    const totalPages = getTotalPages(total, pageSize)
    const page = clampPage(requestedPage, totalPages)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: products, error: productsError } = await dataQuery.range(from, to)
    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products ?? [],
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити товари.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
