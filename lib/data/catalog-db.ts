import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { fetchAllCategories } from '@/lib/data/categories'
import { applyDisplayCategoryParents } from '@/lib/shop/category-display'
import { unstable_cache } from 'next/cache'
import { clampPage, getTotalPages, SHOP_PRODUCTS_PAGE_SIZE } from '@/lib/pagination'
import {
  DEFAULT_SHOP_PRODUCT_SORT,
  type ProductSortKey,
} from '@/lib/product-sort'
import type { Brand, Category, Product, ProductCard, ShopFacetRow } from '@/types'

interface DbCategoryRow {
  id: string
  slug: string
  name_ua: string
  parent_id: string | null
  image_url: string | null
  sort_order: number
}

interface DbBrandRow {
  id: string
  name: string
  logo_url: string | null
}

interface DbProductRow {
  id: string
  slug: string
  name_ua: string
  description_ua: string
  price: number
  sale_price: number | null
  stock: number
  category_id: string
  brand_id: string | null
  specs: Record<string, string>
  images: string[]
  video_urls?: string[]
  is_featured: boolean
  created_at: string
  category?: DbCategoryRow | DbCategoryRow[]
  brand?: DbBrandRow | DbBrandRow[]
}

interface CatalogReadOptions {
  dbOnly?: boolean
}

function rowToCategory(row: DbCategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    parent_id: row.parent_id,
    image_url: row.image_url,
    sort_order: row.sort_order,
  }
}

function rowToBrand(row: DbBrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    logo_url: row.logo_url,
  }
}

function unwrapRelation<T>(value?: T | T[]): T | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

function rowToProduct(row: DbProductRow): Product {
  const category = unwrapRelation(row.category)
  const brand = unwrapRelation(row.brand)
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    description_ua: row.description_ua,
    price: Number(row.price),
    sale_price: row.sale_price === null ? null : Number(row.sale_price),
    stock: row.stock,
    category_id: row.category_id,
    brand_id: row.brand_id,
    specs: row.specs ?? {},
    images: row.images ?? [],
    video_urls: row.video_urls ?? [],
    is_featured: row.is_featured,
    created_at: row.created_at,
    category: category ? rowToCategory(category) : undefined,
    brand: brand ? rowToBrand(brand) : undefined,
  }
}

function rowToProductCard(row: DbProductRow): ProductCard {
  const category = unwrapRelation(row.category)
  const brand = unwrapRelation(row.brand)
  const images = row.images ?? []
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    price: Number(row.price),
    sale_price: row.sale_price === null ? null : Number(row.sale_price),
    // Shop cards / quick-view only use the first image; keep the payload lean.
    images: images.length > 0 ? [images[0]!] : [],
    stock: row.stock,
    created_at: row.created_at,
    category: category
      ? { name_ua: category.name_ua, slug: category.slug }
      : undefined,
    brand: brand ? { name: brand.name } : undefined,
  }
}

function rowToShopFacetRow(row: DbProductRow): ShopFacetRow {
  const brand = unwrapRelation(row.brand)
  return {
    id: row.id,
    slug: row.slug,
    name_ua: row.name_ua,
    price: Number(row.price),
    sale_price: row.sale_price === null ? null : Number(row.sale_price),
    stock: row.stock,
    created_at: row.created_at,
    specs: row.specs ?? {},
    brand: brand ? { name: brand.name } : undefined,
  }
}

async function fetchCategories(_dbOnly: boolean): Promise<Category[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await fetchAllCategories(supabase)
    if (error || data.length === 0) return []
    return applyDisplayCategoryParents((data as DbCategoryRow[]).map(rowToCategory))
  } catch {
    return []
  }
}

/**
 * TTLs here are a safety net, not the primary freshness mechanism: imports and
 * admin edits call `revalidateCatalogCache()`, which busts these tags at once.
 * A short TTL only forced the category taxonomy pass to re-run for no benefit.
 */
const CATALOG_CACHE_TTL = 600

const getCategoriesCached = unstable_cache(
  () => fetchCategories(false),
  ['catalog-categories', 'db-only'],
  { revalidate: CATALOG_CACHE_TTL, tags: ['catalog-categories'] }
)

const getCategoriesDbOnlyCached = unstable_cache(
  () => fetchCategories(true),
  ['catalog-categories-dbonly', 'db-only'],
  { revalidate: CATALOG_CACHE_TTL, tags: ['catalog-categories'] }
)

export async function getCategories(options?: CatalogReadOptions): Promise<Category[]> {
  return options?.dbOnly ? getCategoriesDbOnlyCached() : getCategoriesCached()
}

async function fetchUsedCategoryIds(): Promise<string[]> {
  try {
    const supabase = createStaticClient()
    const ids = new Set<string>()
    const pageSize = 1000
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .range(from, from + pageSize - 1)
      if (error || !data || data.length === 0) break
      for (const row of data as Array<{ category_id: string }>) {
        if (row.category_id) ids.add(row.category_id)
      }
      if (data.length < pageSize) break
      from += pageSize
    }
    return [...ids]
  } catch {
    return []
  }
}

const getUsedCategoryIdsCached = unstable_cache(
  fetchUsedCategoryIds,
  ['catalog-used-category-ids', 'db-only'],
  // Pages through every product row, so keep it cached until an import
  // invalidates the tag rather than re-scanning each minute.
  { revalidate: CATALOG_CACHE_TTL, tags: ['catalog-products', 'catalog-categories'] }
)

export async function getUsedCategoryIds(): Promise<Set<string>> {
  return new Set(await getUsedCategoryIdsCached())
}

async function fetchBrands(_dbOnly: boolean): Promise<Brand[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('brands')
      .select('id,name,logo_url')
      .order('name', { ascending: true })

    if (error || !data || data.length === 0) return []
    return (data as DbBrandRow[]).map(rowToBrand)
  } catch {
    return []
  }
}

const getBrandsCached = unstable_cache(
  () => fetchBrands(false),
  ['catalog-brands', 'db-only'],
  // Tagged so an import refreshes brands too — previously time-only.
  { revalidate: CATALOG_CACHE_TTL, tags: ['catalog-products', 'catalog-categories'] }
)

export async function getBrands(options?: CatalogReadOptions): Promise<Brand[]> {
  return options?.dbOnly ? fetchBrands(true) : getBrandsCached()
}

async function fetchProductCards(_dbOnly: boolean): Promise<ProductCard[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,slug,name_ua,price,sale_price,stock,images,category_id,brand_id,created_at,
        category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
        brand:brands(id,name,logo_url)
      `)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) return []
    return (data as DbProductRow[]).map(rowToProductCard)
  } catch {
    return []
  }
}

const getProductCardsCached = unstable_cache(
  () => fetchProductCards(false),
  ['catalog-product-cards', 'db-only'],
  { revalidate: 60, tags: ['catalog-products'] }
)

export async function getProductCardsFromDb(options?: CatalogReadOptions): Promise<ProductCard[]> {
  return options?.dbOnly ? fetchProductCards(true) : getProductCardsCached()
}

export async function getProductsFromDb(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const baseSelect = `
      id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
      category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
      brand:brands(id,name,logo_url)
    `
    const { data, error } = await supabase
      .from('products')
      .select(`video_urls,${baseSelect}`)
      .order('created_at', { ascending: false })

    if (error) {
      const msg = String((error as any).message ?? error)
      if (msg.includes('video_urls')) {
        const retry = await supabase
          .from('products')
          .select(baseSelect)
          .order('created_at', { ascending: false })
        if (retry.error || !retry.data || retry.data.length === 0) return []
        return (retry.data as DbProductRow[]).map(rowToProduct)
      }
      return []
    }
    if (!data || data.length === 0) return []
    return (data as DbProductRow[]).map(rowToProduct)
  } catch {
    return []
  }
}

export async function getProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  try {
    const supabase = await createClient()
    const baseSelect = `
      id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images,is_featured,created_at,
      category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
      brand:brands(id,name,logo_url)
    `
    const { data, error } = await supabase
      .from('products')
      .select(`video_urls,${baseSelect}`)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      const msg = String((error as any).message ?? error)
      if (msg.includes('video_urls')) {
        const retry = await supabase
          .from('products')
          .select(baseSelect)
          .eq('slug', slug)
          .maybeSingle()
        if (retry.error || !retry.data) return undefined
        return rowToProduct(retry.data as DbProductRow)
      }
      return undefined
    }
    if (!data) return undefined
    return rowToProduct(data as DbProductRow)
  } catch {
    return undefined
  }
}

const SHOP_CARD_SELECT = `
  id,slug,name_ua,price,sale_price,stock,images,category_id,brand_id,created_at,
  category:categories(id,slug,name_ua,parent_id,image_url,sort_order),
  brand:brands(id,name,logo_url)
`

export type ShopProductsQuery = {
  categoryIds?: string[] | null
  brandNames?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  q?: string
  sort?: ProductSortKey
  page?: number
  pageSize?: number
}

function shopSortOrder(sort: ProductSortKey): {
  column: string
  ascending: boolean
} {
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
    case 'newest':
    default:
      return { column: 'created_at', ascending: false }
  }
}

/** Server-paginated shop listing — only one page of lean cards crosses the wire. */
export async function getShopProductsPage(query: ShopProductsQuery): Promise<{
  products: ProductCard[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const pageSize =
    Number.isFinite(query.pageSize) && (query.pageSize ?? 0) > 0
      ? Math.min(48, Math.floor(query.pageSize!))
      : SHOP_PRODUCTS_PAGE_SIZE
  const sort = query.sort ?? DEFAULT_SHOP_PRODUCT_SORT
  const { column, ascending } = shopSortOrder(sort)

  try {
    const supabase = createStaticClient()

    let countQuery = supabase.from('products').select('id', { count: 'exact', head: true })
    let dataQuery = supabase
      .from('products')
      .select(SHOP_CARD_SELECT)
      .order(column, { ascending })
      .order('id', { ascending: true })

    if (query.categoryIds) {
      if (query.categoryIds.length === 0) {
        return { products: [], total: 0, page: 1, pageSize, totalPages: 1 }
      }
      countQuery = countQuery.in('category_id', query.categoryIds)
      dataQuery = dataQuery.in('category_id', query.categoryIds)
    }

    if (query.brandNames && query.brandNames.length > 0) {
      const { data: brandRows } = await supabase
        .from('brands')
        .select('id,name')
        .in('name', query.brandNames)
      const brandIds = (brandRows ?? []).map(b => b.id)
      if (brandIds.length === 0) {
        return { products: [], total: 0, page: 1, pageSize, totalPages: 1 }
      }
      countQuery = countQuery.in('brand_id', brandIds)
      dataQuery = dataQuery.in('brand_id', brandIds)
    }

    if (query.minPrice !== undefined && Number.isFinite(query.minPrice)) {
      countQuery = countQuery.gte('price', query.minPrice)
      dataQuery = dataQuery.gte('price', query.minPrice)
    }
    if (query.maxPrice !== undefined && Number.isFinite(query.maxPrice)) {
      countQuery = countQuery.lte('price', query.maxPrice)
      dataQuery = dataQuery.lte('price', query.maxPrice)
    }
    if (query.inStock) {
      countQuery = countQuery.gt('stock', 0)
      dataQuery = dataQuery.gt('stock', 0)
    }
    if (query.q?.trim()) {
      const q = query.q.trim().replace(/[%_,.()"'\\]/g, ' ').slice(0, 80)
      countQuery = countQuery.ilike('name_ua', `%${q}%`)
      dataQuery = dataQuery.ilike('name_ua', `%${q}%`)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      return { products: [], total: 0, page: 1, pageSize, totalPages: 1 }
    }

    const total = Number(count ?? 0)
    const totalPages = getTotalPages(total, pageSize)
    const page = clampPage(query.page ?? 1, totalPages)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error } = await dataQuery.range(from, to)
    if (error || !data) {
      return { products: [], total, page, pageSize, totalPages }
    }

    return {
      products: (data as DbProductRow[]).map(rowToProductCard),
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch {
    return { products: [], total: 0, page: 1, pageSize, totalPages: 1 }
  }
}

/** Slim select for category facet index — no images / category joins. */
const SHOP_FACET_INDEX_SELECT = `
  id,slug,name_ua,price,sale_price,stock,created_at,specs,
  brand:brands(name)
`

/** PostgREST caps each response at ~1000 rows — page through the full set. */
const FACET_FETCH_PAGE_SIZE = 1000

/**
 * Soft ceiling so a runaway query cannot blow memory. Multimedia alone is
 * already >2k SKUs; raise if the catalog grows past this.
 */
const CATEGORY_FACET_FETCH_LIMIT = 10_000

async function fetchCategoryFacetIndex(
  categoryIds: string[] | null
): Promise<ShopFacetRow[]> {
  try {
    const supabase = createStaticClient()
    const rows: ShopFacetRow[] = []
    let from = 0

    while (from < CATEGORY_FACET_FETCH_LIMIT) {
      const to = Math.min(from + FACET_FETCH_PAGE_SIZE - 1, CATEGORY_FACET_FETCH_LIMIT - 1)
      let dataQuery = supabase
        .from('products')
        .select(SHOP_FACET_INDEX_SELECT)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)

      if (categoryIds) {
        if (categoryIds.length === 0) return []
        dataQuery = dataQuery.in('category_id', categoryIds)
      }

      const { data, error } = await dataQuery
      if (error || !data) break

      rows.push(...(data as DbProductRow[]).map(rowToShopFacetRow))
      if (data.length < FACET_FETCH_PAGE_SIZE) break
      from += FACET_FETCH_PAGE_SIZE
    }

    return rows
  } catch {
    return []
  }
}

/**
 * Slim category index (id / name / specs / price…) for in-memory facets.
 *
 * Not wrapped in `unstable_cache`: a full multimedia tree can still exceed the
 * Next.js Data Cache ~2MB limit. React `cache()` dedupes within a request.
 * Full product cards (with images) are loaded only for the current page via
 * `getProductCardsByIds`.
 */
const getCategoryFacetIndexCached = cache(
  async (cacheKey: string): Promise<ShopFacetRow[]> => {
    const categoryIds =
      cacheKey === 'all' ? null : cacheKey.split(',').filter(Boolean)
    return fetchCategoryFacetIndex(categoryIds)
  }
)

export async function getCategoryFacetIndex(
  categoryIds: string[] | null
): Promise<ShopFacetRow[]> {
  const cacheKey = categoryIds ? [...categoryIds].sort().join(',') : 'all'
  return getCategoryFacetIndexCached(cacheKey)
}

/** Full shop cards for a page of IDs, preserving `ids` order. */
export async function getProductCardsByIds(ids: string[]): Promise<ProductCard[]> {
  if (ids.length === 0) return []

  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('products')
      .select(SHOP_CARD_SELECT)
      .in('id', ids)

    if (error || !data) return []

    const byId = new Map(
      (data as DbProductRow[]).map(row => [row.id, rowToProductCard(row)])
    )
    return ids.map(id => byId.get(id)).filter((p): p is ProductCard => !!p)
  } catch {
    return []
  }
}


