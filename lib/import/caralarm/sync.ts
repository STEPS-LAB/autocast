import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveBrandId } from '@/lib/admin/resolve-brand'
import { slugify, slugifyName } from '@/lib/utils'
import type { Brand } from '@/types'
import { type CategoryMatchCandidate } from '@/lib/import/yml/category-match'
import { resolveFeedCategoryIdAtMaxDepth } from '@/lib/import/yml/category-tree'
import {
  ensureNamedCategory,
  importCategoryTree,
} from '@/lib/import/yml/category-import'
import {
  pricingNeedsUpdate,
  productNeedsUpdate,
  type ProductDiffRow,
  type ProductWritePayload,
} from '@/lib/import/yml/product-diff'
import type { YmlCategory } from '@/lib/import/yml/types'
import { shouldKeepCaralarmOffer, stockFromCaralarmOffer } from './availability'
import { filterBlockedCategoryOffers } from './categories'
import { getCaralarmExportFeedUrl, getCaralarmMarketFeedUrl } from './feed'
import {
  parseCaralarmExportFromUrl,
  parseCaralarmMarketFromUrl,
} from './parser'
import { retailUahFromOffer } from './pricing'
import type {
  CaralarmOffer,
  CaralarmSyncMode,
  CaralarmSyncProgress,
  CaralarmSyncResult,
} from './types'
import {
  CARALARM_CODE_SPEC_KEY,
  CARALARM_OFFER_ID_SPEC_KEY,
  CARALARM_SUPPLIER,
  SUPPLIER_SPEC_KEY,
} from './types'

const MAX_IMAGES_PER_PRODUCT = 10
const WRITE_CONCURRENCY = 8
const MIN_FEED_OFFERS_FOR_DELETE = 5_000
const MAX_DELETE_RATIO = 0.4
const PRODUCT_DIFF_SELECT =
  'id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images'

type ProductRow = ProductDiffRow & {
  id: string
  slug: string
}

/** Merged catalog row: market for stock/price fields, export for content when present. */
export type MergedCaralarmOffer = {
  offerId: string
  market: CaralarmOffer
  content: CaralarmOffer
  price: number
  stock: number
}

export function assertSafeToDelete(input: {
  feedOfferCount: number
  existingCount: number
  deleteCount: number
  minFeedOffers?: number
  maxDeleteRatio?: number
}): { ok: true } | { ok: false; reason: string } {
  const minFeed = input.minFeedOffers ?? MIN_FEED_OFFERS_FOR_DELETE
  const maxRatio = input.maxDeleteRatio ?? MAX_DELETE_RATIO

  if (input.feedOfferCount < minFeed) {
    return {
      ok: false,
      reason: `Фід повернув лише ${input.feedOfferCount} offer (мінімум ${minFeed}) — видалення скасовано.`,
    }
  }
  if (input.existingCount > 0 && input.deleteCount / input.existingCount > maxRatio) {
    const pct = Math.round((input.deleteCount / input.existingCount) * 100)
    return {
      ok: false,
      reason: `Під видалення потрапляє ${input.deleteCount} з ${input.existingCount} товарів Caralarm (${pct}%) — поріг ${Math.round(maxRatio * 100)}%.`,
    }
  }
  return { ok: true }
}

export function mergeMarketWithExport(
  marketOffers: CaralarmOffer[],
  exportById: Map<string, CaralarmOffer>,
  categories: YmlCategory[]
): {
  toKeep: MergedCaralarmOffer[]
  skippedNoPrice: number
  skippedOos: number
  skippedBlocked: number
} {
  const { kept: unblocked, blocked: skippedBlocked } = filterBlockedCategoryOffers(
    categories,
    marketOffers
  )

  const toKeep: MergedCaralarmOffer[] = []
  let skippedNoPrice = 0
  let skippedOos = 0

  for (const market of unblocked) {
    if (!shouldKeepCaralarmOffer(market)) {
      skippedOos += 1
      continue
    }
    const price = retailUahFromOffer(market)
    if (price == null) {
      skippedNoPrice += 1
      continue
    }
    const content = exportById.get(market.offerId) ?? market
    toKeep.push({
      offerId: market.offerId,
      market,
      content,
      price,
      stock: stockFromCaralarmOffer(market),
    })
  }

  return { toKeep, skippedNoPrice, skippedOos, skippedBlocked }
}

function buildSpecs(merged: MergedCaralarmOffer): Record<string, string> {
  const { content, market } = merged
  const specs: Record<string, string> = {
    [SUPPLIER_SPEC_KEY]: CARALARM_SUPPLIER,
    [CARALARM_OFFER_ID_SPEC_KEY]: merged.offerId,
    ...content.params,
  }
  const code = content.productCode || market.productCode
  if (code) specs[CARALARM_CODE_SPEC_KEY] = code
  if (content.url || market.url) {
    specs['Джерело'] = (content.url || market.url)!
  }
  return specs
}

function buildDescription(content: CaralarmOffer): string {
  const full = content.description.trim()
  if (full) return full
  const short = content.descriptionShort.trim()
  if (short) return short
  return content.name
}

function buildWritePayload(
  merged: MergedCaralarmOffer,
  categoryId: string,
  brandId: string | null
): ProductWritePayload {
  const images = merged.content.pictures.slice(0, MAX_IMAGES_PER_PRODUCT)
  return {
    name_ua: merged.content.name || merged.market.name,
    description_ua: buildDescription(merged.content),
    price: merged.price,
    sale_price: null,
    stock: merged.stock,
    category_id: categoryId,
    brand_id: brandId,
    specs: buildSpecs(merged),
    images,
  }
}

function caralarmOfferIdFromSpecs(specs: Record<string, string> | null): string | undefined {
  if (!specs) return undefined
  if (specs[SUPPLIER_SPEC_KEY] !== CARALARM_SUPPLIER) return undefined
  return specs[CARALARM_OFFER_ID_SPEC_KEY] || undefined
}

async function loadExistingCaralarmByOfferId(
  supabase: SupabaseClient
): Promise<Map<string, ProductRow>> {
  const byOfferId = new Map<string, ProductRow>()
  const PAGE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_DIFF_SELECT)
      .filter(`specs->>${SUPPLIER_SPEC_KEY}`, 'eq', CARALARM_SUPPLIER)
      .range(from, from + PAGE - 1)

    if (error) {
      // Fallback: page all products and filter in memory.
      const { data: page, error: pageError } = await supabase
        .from('products')
        .select(PRODUCT_DIFF_SELECT)
        .range(from, from + PAGE - 1)
      if (pageError) throw new Error(pageError.message)
      const rows = (page ?? []) as ProductRow[]
      for (const row of rows) {
        const offerId = caralarmOfferIdFromSpecs(row.specs)
        if (offerId) byOfferId.set(offerId, row)
      }
      if (rows.length < PAGE) break
      from += PAGE
      continue
    }

    const rows = (data ?? []) as ProductRow[]
    for (const row of rows) {
      const offerId = caralarmOfferIdFromSpecs(row.specs)
      if (offerId) byOfferId.set(offerId, row)
    }
    if (rows.length < PAGE) break
    from += PAGE
  }

  return byOfferId
}

function buildSlugCandidates(baseName: string, offerId: string): string[] {
  const idPart = slugify(offerId) || offerId.replace(/[^a-zA-Z0-9_-]/g, '') || 'item'
  const namePart = slugifyName(baseName, '')
  return [
    namePart ? `${namePart}-ca-${idPart}` : `caralarm-${idPart}`,
    `caralarm-${idPart}`,
    `caralarm-${idPart}-${Date.now()}`,
  ].filter(Boolean)
}

async function uniqueSlug(
  supabase: SupabaseClient,
  baseName: string,
  offerId: string,
  reservedSlugs: Set<string>,
  excludeId?: string
): Promise<string> {
  for (const candidate of buildSlugCandidates(baseName, offerId)) {
    if (reservedSlugs.has(candidate)) continue
    reservedSlugs.add(candidate)

    let query = supabase.from('products').select('id').eq('slug', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return candidate
  }

  const fallback = `caralarm-${offerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  reservedSlugs.add(fallback)
  return fallback
}

function isUniqueViolation(message: string): boolean {
  return /duplicate key|unique constraint|products_slug_key/i.test(message)
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let index = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index
      index += 1
      const item = items[current]
      if (item !== undefined) await worker(item, current)
    }
  })
  await Promise.all(runners)
}

async function deleteProductsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  let deleted = 0
  const CHUNK = 100
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK)
    const { error } = await supabase.from('products').delete().in('id', chunk)
    if (error) throw new Error(error.message)
    deleted += chunk.length
  }
  return deleted
}

export type RunCaralarmSyncOptions = {
  mode: CaralarmSyncMode
  supabase: SupabaseClient
  onProgress?: (progress: CaralarmSyncProgress) => void
  /** Stop writing when Date.now() exceeds this; return done=false. */
  deadlineMs?: number
  marketUrl?: string
  exportUrl?: string
}

export async function runCaralarmSync(
  options: RunCaralarmSyncOptions
): Promise<CaralarmSyncResult> {
  const { mode, supabase, onProgress, deadlineMs } = options
  const marketUrl = options.marketUrl ?? getCaralarmMarketFeedUrl()
  const exportUrl = options.exportUrl ?? getCaralarmExportFeedUrl()

  const result: CaralarmSyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    priceUpdates: 0,
    errors: [],
    processed: 0,
    total: 0,
    done: true,
  }

  let lastProgressAt = 0
  function emitProgress(force = false, message?: string) {
    const now = Date.now()
    if (!force && now - lastProgressAt < 400) return
    lastProgressAt = now
    onProgress?.({
      processed: result.processed,
      total: result.total,
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
      skipped: result.skipped,
      message,
    })
  }

  onProgress?.({
    processed: 0,
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    message: 'Завантаження market-фіду…',
  })

  const marketParsed = await parseCaralarmMarketFromUrl(marketUrl)
  const feedOfferCount = marketParsed.totalOffers

  let exportById = new Map<string, CaralarmOffer>()
  let categories = marketParsed.categories

  if (mode === 'catalog') {
    onProgress?.({
      processed: 0,
      total: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      message: 'Завантаження export-фіду…',
    })
    const exportParsed = await parseCaralarmExportFromUrl(exportUrl)
    exportById = new Map(exportParsed.offers.map(o => [o.offerId, o]))
    // Prefer export category tree (same ids) when present.
    if (exportParsed.categories.length > 0) categories = exportParsed.categories
  }

  const { toKeep, skippedNoPrice, skippedOos, skippedBlocked } = mergeMarketWithExport(
    marketParsed.offers,
    exportById,
    categories
  )
  result.skipped += skippedNoPrice + skippedOos + skippedBlocked

  const byOfferId = await loadExistingCaralarmByOfferId(supabase)
  const keepIds = new Set(toKeep.map(o => o.offerId))

  // Deletes: existing Caralarm products not in keep set (OOS / blocked / no price).
  const toDelete: ProductRow[] = []
  for (const [offerId, row] of byOfferId) {
    if (!keepIds.has(offerId)) toDelete.push(row)
  }

  const deleteGuard = assertSafeToDelete({
    feedOfferCount,
    existingCount: byOfferId.size,
    deleteCount: toDelete.length,
  })
  if (!deleteGuard.ok) {
    // In prices mode with few existing products, still allow empty delete;
    // but never mass-delete on a truncated feed.
    if (toDelete.length > 0) {
      result.errors.push(deleteGuard.reason)
      result.done = false
      result.total = toKeep.length
      return result
    }
  } else if (toDelete.length > 0) {
    onProgress?.({
      processed: 0,
      total: toKeep.length,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: result.skipped,
      message: `Видалення ${toDelete.length} відсутніх товарів…`,
    })
    result.deleted = await deleteProductsByIds(
      supabase,
      toDelete.map(r => r.id)
    )
    for (const row of toDelete) {
      const oid = caralarmOfferIdFromSpecs(row.specs)
      if (oid) byOfferId.delete(oid)
    }
  }

  // Prices mode: lazy-load export only for new in-stock offers missing from DB.
  if (mode === 'prices') {
    const missing = toKeep.filter(o => !byOfferId.has(o.offerId))
    if (missing.length > 0) {
      onProgress?.({
        processed: 0,
        total: toKeep.length,
        created: 0,
        updated: 0,
        deleted: result.deleted,
        skipped: result.skipped,
        message: `Завантаження export для ${missing.length} нових товарів…`,
      })
      const exportParsed = await parseCaralarmExportFromUrl(exportUrl)
      exportById = new Map(exportParsed.offers.map(o => [o.offerId, o]))
      if (exportParsed.categories.length > 0) categories = exportParsed.categories
      for (const merged of toKeep) {
        const content = exportById.get(merged.offerId)
        if (content) merged.content = content
      }
    }
  }

  result.total = toKeep.length

  const usedLeafIds = toKeep.map(o => o.content.categoryId || o.market.categoryId)
  const categoryIds = await importCategoryTree(supabase, categories, usedLeafIds)
  const fallbackCache = new Map<string, string>()
  const matchCandidates: CategoryMatchCandidate[] = []
  {
    const PAGE = 1000
    let from = 0
    while (true) {
      const { data: page, error } = await supabase
        .from('categories')
        .select('id,name_ua,parent_id')
        .range(from, from + PAGE - 1)
      if (error) throw new Error(error.message)
      const rows = page ?? []
      for (const row of rows) {
        matchCandidates.push({
          id: String(row.id),
          nameUa: String(row.name_ua),
          parentId: (row.parent_id as string | null) ?? null,
        })
      }
      if (rows.length < PAGE) break
      from += PAGE
    }
  }

  const { data: brands } = await supabase.from('brands').select('id,name,logo_url')
  let knownBrands = (brands ?? []) as Brand[]
  const brandCache = new Map<string, string | null>()
  const reservedSlugs = new Set<string>()

  async function resolveVendorBrandId(vendor: string | null): Promise<string | null> {
    const key = (vendor ?? '').trim()
    if (!key) return null
    const cacheKey = key.toLowerCase()
    if (brandCache.has(cacheKey)) return brandCache.get(cacheKey) ?? null
    const { brandId, newBrand } = await resolveBrandId(supabase, knownBrands, key)
    if (newBrand) knownBrands = [...knownBrands, newBrand]
    brandCache.set(cacheKey, brandId)
    return brandId
  }

  async function resolveProductCategoryId(merged: MergedCaralarmOffer): Promise<string | null> {
    const leafId = merged.content.categoryId || merged.market.categoryId
    const feedId = resolveFeedCategoryIdAtMaxDepth(categories, leafId) ?? leafId
    const fromTree = categoryIds.get(feedId)
    if (fromTree) return fromTree
    return ensureNamedCategory(
      supabase,
      merged.content.categoryName || merged.market.categoryName || 'Інше',
      fallbackCache,
      matchCandidates
    )
  }

  async function insertProduct(
    merged: MergedCaralarmOffer,
    categoryId: string,
    brandId: string | null,
    payload: ProductWritePayload
  ): Promise<ProductRow> {
    let lastError: Error | null = null
    for (let attempt = 0; attempt < 4; attempt++) {
      const slug = await uniqueSlug(
        supabase,
        payload.name_ua,
        merged.offerId,
        reservedSlugs
      )
      const { data: inserted, error } = await supabase
        .from('products')
        .insert({
          slug,
          name_ua: payload.name_ua,
          description_ua: payload.description_ua,
          price: payload.price,
          sale_price: payload.sale_price,
          stock: payload.stock,
          category_id: categoryId,
          brand_id: brandId,
          specs: payload.specs,
          images: payload.images,
          is_featured: false,
        })
        .select(PRODUCT_DIFF_SELECT)
        .single()

      if (!error && inserted) return inserted as ProductRow

      const message = error?.message ?? 'Не вдалося створити товар.'
      reservedSlugs.delete(slug)
      if (!isUniqueViolation(message)) throw new Error(message)
      lastError = new Error(message)
      reservedSlugs.add(slug)
    }
    throw lastError ?? new Error('Не вдалося створити товар після повторів slug.')
  }

  let abortedForDeadline = false

  await mapPool(toKeep, WRITE_CONCURRENCY, async merged => {
    if (abortedForDeadline) {
      result.skipped += 1
      return
    }
    if (deadlineMs != null && Date.now() > deadlineMs) {
      abortedForDeadline = true
      result.done = false
      result.skipped += 1
      return
    }

    try {
      const existing = byOfferId.get(merged.offerId)

      // Prices-only updates for existing products: skip category/brand/images rewrite
      // when mode is prices and product already exists — still update name/desc if export loaded.
      const categoryId = await resolveProductCategoryId(merged)
      if (!categoryId) {
        result.errors.push(`${merged.offerId}: категорію не знайдено.`)
        result.skipped += 1
        return
      }

      const brandId = await resolveVendorBrandId(
        merged.content.vendor || merged.market.vendor
      )
      const payload = buildWritePayload(merged, categoryId, brandId)

      if (existing) {
        if (mode === 'prices') {
          // Prefer light update: price + stock (+ content if we have export pictures/desc).
          const lightPayload: ProductWritePayload = {
            ...payload,
            // Keep existing category/brand unless missing
            category_id: existing.category_id ?? categoryId,
            brand_id: existing.brand_id ?? brandId,
            images:
              payload.images.length > 0
                ? payload.images
                : (existing.images ?? []),
            description_ua:
              payload.description_ua || existing.description_ua || payload.name_ua,
          }
          if (!productNeedsUpdate(existing, lightPayload)) {
            result.skipped += 1
            return
          }
          const { error } = await supabase
            .from('products')
            .update({
              name_ua: lightPayload.name_ua,
              description_ua: lightPayload.description_ua,
              price: lightPayload.price,
              sale_price: lightPayload.sale_price,
              stock: lightPayload.stock,
              category_id: lightPayload.category_id,
              brand_id: lightPayload.brand_id,
              specs: lightPayload.specs,
              images: lightPayload.images,
            })
            .eq('id', existing.id)
          if (error) throw new Error(error.message)
          if (pricingNeedsUpdate(existing, lightPayload)) result.priceUpdates += 1
          result.updated += 1
          return
        }

        if (!productNeedsUpdate(existing, payload)) {
          result.skipped += 1
          return
        }
        const { error } = await supabase
          .from('products')
          .update({
            name_ua: payload.name_ua,
            description_ua: payload.description_ua,
            price: payload.price,
            sale_price: payload.sale_price,
            stock: payload.stock,
            category_id: payload.category_id,
            brand_id: payload.brand_id,
            specs: payload.specs,
            images: payload.images,
          })
          .eq('id', existing.id)
        if (error) throw new Error(error.message)
        if (pricingNeedsUpdate(existing, payload)) result.priceUpdates += 1
        result.updated += 1
        return
      }

      const inserted = await insertProduct(merged, categoryId, brandId, payload)
      byOfferId.set(merged.offerId, inserted)
      result.created += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Невідома помилка'
      result.errors.push(`${merged.offerId}: ${message}`)
      result.skipped += 1
    } finally {
      result.processed += 1
      emitProgress()
    }
  })

  emitProgress(true)
  result.errors = result.errors.slice(0, 50)
  if (abortedForDeadline) result.done = false
  return result
}
