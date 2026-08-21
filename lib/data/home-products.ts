import { unstable_cache } from 'next/cache'
import { getShopProductsPage } from '@/lib/data/catalog-db'
import type { ProductCard } from '@/types'

/** How many products the homepage showcase renders. */
export const HOME_PRODUCT_COUNT = 4

/**
 * How often the random selection changes. The homepage itself is cached
 * (`revalidate = 120`), so a shorter rotation than that would not be visible
 * anyway — and re-picking on every request would defeat the cache entirely.
 */
const ROTATION_MS = 600_000

/** Extra candidates drawn per round so duplicates or gaps still leave four. */
const CANDIDATE_OVERDRAW = 4

/**
 * Small deterministic PRNG (mulberry32). Seeded from the rotation bucket so
 * every render inside one bucket picks the same products — the selection is
 * random across time, stable within it.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** `count` distinct integers in [0, range), or all of them when range is smaller. */
function pickDistinctIndices(random: () => number, range: number, count: number): number[] {
  if (range <= 0) return []
  if (range <= count) return Array.from({ length: range }, (_, i) => i)

  const picked = new Set<number>()
  // Bounded: each iteration has at least a (range - count) / range chance of
  // landing on a fresh index, and range > count here.
  while (picked.size < count) {
    picked.add(Math.floor(random() * range))
  }
  return [...picked]
}

/**
 * Four random in-stock products from anywhere in the catalog.
 *
 * The previous version picked one product from each of four hard-coded
 * category slugs. Two of those slugs (`avtomahnitoly`, `videoreyestratory`)
 * do not exist in the catalog, so those slots silently resolved to nothing
 * and the homepage rendered a single product into a four-column grid.
 * Selecting from the whole catalog removes that coupling entirely.
 */
async function fetchHomeProducts(bucket: number): Promise<ProductCard[]> {
  const baseQuery = { inStock: true as const, pageSize: 1 }

  const { total } = await getShopProductsPage({ ...baseQuery, page: 1 })
  if (total <= 0) return []

  const random = createRandom(bucket)
  // Overdraw so a product disappearing between the count and the reads (or a
  // duplicate) still leaves four to show.
  const candidates = pickDistinctIndices(
    random,
    total,
    HOME_PRODUCT_COUNT + CANDIDATE_OVERDRAW
  )

  const results = await Promise.all(
    candidates.map(index =>
      getShopProductsPage({ ...baseQuery, page: index + 1 }).then(r => r.products[0] ?? null)
    )
  )

  const products: ProductCard[] = []
  const seen = new Set<string>()
  for (const product of results) {
    if (!product || seen.has(product.id)) continue
    seen.add(product.id)
    products.push(product)
    if (products.length === HOME_PRODUCT_COUNT) break
  }

  return products
}

const getHomeProductsCached = unstable_cache(
  async (bucket: number) => fetchHomeProducts(bucket),
  ['home-featured-products'],
  { revalidate: ROTATION_MS / 1000, tags: ['catalog-products', 'home-products'] }
)

/** Four showcase products for the homepage — reshuffled on each rotation. */
export async function getHomeProducts(): Promise<ProductCard[]> {
  const bucket = Math.floor(Date.now() / ROTATION_MS)
  return getHomeProductsCached(bucket)
}
