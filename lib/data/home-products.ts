import { unstable_cache } from 'next/cache'
import { getCategories, getShopProductsPage } from '@/lib/data/catalog-db'
import { resolveShopCategoryIds } from '@/lib/shop/category-tree'
import type { Category, ProductCard } from '@/types'

const HOUR_MS = 3_600_000
const MAGNITOLA_MAX_PRICE = 25_000

type HomeProductSlot = {
  key: string
  /** Root category slug, or null when using a non-root selected slug. */
  rootSlug: string | null
  selectedSlugs: string[]
  maxPrice?: number
  /** If set, use only this category id (no children). */
  onlySlug?: string
}

/** One product from each of these shop branches, rotated hourly. */
const HOME_PRODUCT_SLOTS: HomeProductSlot[] = [
  { key: 'avtozvuk', rootSlug: 'avtozvuk', selectedSlugs: [] },
  {
    key: 'magnitola',
    rootSlug: 'avtomahnitoly',
    selectedSlugs: ['holovni-prystroyi'],
    maxPrice: MAGNITOLA_MAX_PRICE,
  },
  { key: 'avtosvitlo', rootSlug: 'avtosvitlo', selectedSlugs: [] },
  {
    key: 'videoreyestrator',
    rootSlug: 'videoreyestratory',
    selectedSlugs: [],
    onlySlug: 'videoreyestratory',
  },
]

/** Deterministic index in [0, length) from a string seed. */
function seededIndex(seed: string, length: number): number {
  if (length <= 0) return 0
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash) % length
}

function resolveSlotCategoryIds(
  categories: Category[],
  slot: HomeProductSlot
): string[] {
  if (slot.onlySlug) {
    const cat = categories.find(c => c.slug === slot.onlySlug)
    return cat ? [cat.id] : []
  }
  return resolveShopCategoryIds(categories, slot.rootSlug, slot.selectedSlugs) ?? []
}

async function pickSlotProduct(
  slot: HomeProductSlot,
  hourBucket: number,
  categoryIds: string[]
): Promise<ProductCard | null> {
  if (categoryIds.length === 0) return null

  const baseQuery = {
    categoryIds,
    inStock: true as const,
    maxPrice: slot.maxPrice,
    pageSize: 1,
  }

  const { total } = await getShopProductsPage({ ...baseQuery, page: 1 })
  if (total <= 0) return null

  const page = seededIndex(`${hourBucket}:${slot.key}`, total) + 1
  const { products } = await getShopProductsPage({ ...baseQuery, page })
  return products[0] ?? null
}

async function fetchHomeProducts(hourBucket: number): Promise<ProductCard[]> {
  const categories = await getCategories()

  const picked = await Promise.all(
    HOME_PRODUCT_SLOTS.map(slot => {
      const categoryIds = resolveSlotCategoryIds(categories, slot)
      return pickSlotProduct(slot, hourBucket, categoryIds)
    })
  )

  const products: ProductCard[] = []
  const seen = new Set<string>()
  for (const product of picked) {
    if (!product || seen.has(product.id)) continue
    seen.add(product.id)
    products.push(product)
  }

  return products
}

const getHomeProductsCached = unstable_cache(
  async (hourBucket: number) => fetchHomeProducts(hourBucket),
  ['home-featured-products'],
  { revalidate: 3600, tags: ['catalog-products', 'home-products'] }
)

/** Four showcase products for the homepage — selection rotates every hour. */
export async function getHomeProducts(): Promise<ProductCard[]> {
  const hourBucket = Math.floor(Date.now() / HOUR_MS)
  return getHomeProductsCached(hourBucket)
}
