import { createClient as createServerClient } from '@/lib/supabase/server'
import { resolveBrandId } from '@/lib/admin/resolve-brand'
import { fetchAllCategories } from '@/lib/data/categories'
import { slugify, slugifyName } from '@/lib/utils'
import { buildCategoryImportPlan, formatCategoryPath, resolveFeedCategoryIdAtMaxDepth } from './category-tree'
import { parseYmlFromUrl } from './parser'
import { dbPricingFromYmlOffer } from './pricing'
import {
  pricingNeedsUpdate,
  productNeedsUpdate,
  type ProductDiffRow,
  type ProductWritePayload,
} from './product-diff'
import {
  LEGACY_OFFER_ID_SPEC_KEY,
  YML_OFFER_ID_SPEC_KEY,
  YML_SOURCE_URL_SPEC_KEY,
  YML_VENDOR_CODE_SPEC_KEY,
  type ImportPreview,
  type ImportPreviewItem,
  type ImportResult,
  type ParsedYmlOffer,
  type YmlCategory,
} from './types'
import type { Brand } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_IMAGES_PER_PRODUCT = 10
const WRITE_CONCURRENCY = 8
const PRODUCT_DIFF_SELECT =
  'id,slug,name_ua,description_ua,price,sale_price,stock,category_id,brand_id,specs,images'

type ProductRow = ProductDiffRow & {
  id: string
  slug: string
}

function buildSpecs(product: ParsedYmlOffer): Record<string, string> {
  const specs: Record<string, string> = {
    [YML_OFFER_ID_SPEC_KEY]: product.offerId,
    ...product.params,
  }
  if (product.vendorCode) specs[YML_VENDOR_CODE_SPEC_KEY] = product.vendorCode
  if (product.url) specs[YML_SOURCE_URL_SPEC_KEY] = product.url
  return specs
}

function offerIdFromSpecs(specs: Record<string, string> | null): string | undefined {
  if (!specs) return undefined
  return specs[YML_OFFER_ID_SPEC_KEY] || specs[LEGACY_OFFER_ID_SPEC_KEY]
}

function categoryMatchKey(nameUa: string, parentId: string | null): string {
  return `${parentId ?? 'null'}::${nameUa.trim().toLowerCase()}`
}

async function uniqueCategorySlug(
  supabase: SupabaseClient,
  baseName: string,
  reserved: Set<string>
): Promise<string> {
  const base = slugifyName(baseName, 'category')
  let candidate = base
  let suffix = 2

  while (true) {
    if (!reserved.has(candidate)) {
      reserved.add(candidate)
      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      if (!data) return candidate
    }
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

/**
 * Upsert the feed category tree (used leaves + ancestors) and return
 * feedCategoryId → dbCategoryId. Matching is by (name_ua, parent_id).
 */
async function importCategoryTree(
  supabase: SupabaseClient,
  categories: YmlCategory[],
  usedLeafIds: string[]
): Promise<Map<string, string>> {
  const plan = buildCategoryImportPlan(categories, usedLeafIds)
  const feedToDb = new Map<string, string>()
  if (plan.length === 0) return feedToDb

  const { data: existingRows, error: existingError } = await fetchAllCategories(
    supabase,
    'id,name_ua,slug,parent_id'
  )
  if (existingError) throw new Error(existingError.message)

  const byNameParent = new Map<string, { id: string; slug: string }>()
  const reservedSlugs = new Set<string>()
  for (const row of existingRows) {
    byNameParent.set(categoryMatchKey(String(row.name_ua), (row.parent_id as string | null) ?? null), {
      id: String(row.id),
      slug: String(row.slug),
    })
    reservedSlugs.add(String(row.slug))
  }

  for (const node of plan) {
    const parentDbId = node.parentFeedId ? (feedToDb.get(node.parentFeedId) ?? null) : null
    if (node.parentFeedId && !parentDbId) {
      // Parent failed earlier — skip child to avoid orphaned hierarchy.
      continue
    }

    const matchKey = categoryMatchKey(node.name, parentDbId)
    const existing = byNameParent.get(matchKey)
    if (existing) {
      feedToDb.set(node.feedId, existing.id)
      continue
    }

    const slug = await uniqueCategorySlug(supabase, node.name, reservedSlugs)
    const { data: inserted, error } = await supabase
      .from('categories')
      .insert({
        slug,
        name_ua: node.name,
        parent_id: parentDbId,
        image_url: null,
        sort_order: node.sortOrder,
      })
      .select('id,name_ua,slug,parent_id')
      .single()

    if (error) {
      // Race / unique slug collision — try resolve by name+parent again.
      let retryQuery = supabase
        .from('categories')
        .select('id,name_ua,slug,parent_id')
        .eq('name_ua', node.name)
      retryQuery =
        parentDbId == null ? retryQuery.is('parent_id', null) : retryQuery.eq('parent_id', parentDbId)
      const { data: retry } = await retryQuery.maybeSingle()

      if (retry) {
        feedToDb.set(node.feedId, retry.id)
        byNameParent.set(categoryMatchKey(retry.name_ua, retry.parent_id ?? null), {
          id: retry.id,
          slug: retry.slug,
        })
      }
      continue
    }

    if (inserted) {
      feedToDb.set(node.feedId, inserted.id)
      byNameParent.set(categoryMatchKey(inserted.name_ua, inserted.parent_id ?? null), {
        id: inserted.id,
        slug: inserted.slug,
      })
    }
  }

  return feedToDb
}

/** Ensure a flat fallback category exists for unrecognized feed leaf IDs. */
async function ensureFallbackCategory(
  supabase: SupabaseClient,
  feedCategoryId: string,
  cache: Map<string, string>
): Promise<string | null> {
  if (cache.has(feedCategoryId)) return cache.get(feedCategoryId) ?? null

  const name = `Категорія ${feedCategoryId}`
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name_ua', name)
    .is('parent_id', null)
    .maybeSingle()

  if (existing?.id) {
    cache.set(feedCategoryId, existing.id)
    return existing.id
  }

  const slug = await uniqueCategorySlug(supabase, name, new Set())
  const numericId = Number.parseInt(feedCategoryId, 10)
  const sortOrder = Number.isFinite(numericId) ? 900 + numericId : 900
  const { data: inserted, error } = await supabase
    .from('categories')
    .insert({
      slug,
      name_ua: name,
      parent_id: null,
      image_url: null,
      sort_order: sortOrder,
    })
    .select('id')
    .single()

  if (error || !inserted) return null
  cache.set(feedCategoryId, inserted.id)
  return inserted.id
}

async function loadExistingByOfferId(supabase: SupabaseClient): Promise<Map<string, ProductRow>> {
  const byOfferId = new Map<string, ProductRow>()
  const PAGE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_DIFF_SELECT)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const page = (data ?? []) as ProductRow[]
    for (const row of page) {
      const offerId = offerIdFromSpecs(row.specs)
      if (offerId) byOfferId.set(offerId, row)
    }
    if (page.length < PAGE) break
    from += PAGE
  }

  return byOfferId
}

function buildWritePayload(
  product: ParsedYmlOffer,
  categoryId: string,
  brandId: string | null,
  specs: Record<string, string>,
  images: string[]
): ProductWritePayload {
  const pricing = dbPricingFromYmlOffer(product)
  return {
    name_ua: product.name,
    description_ua: product.description || product.name,
    price: pricing.price,
    sale_price: pricing.sale_price,
    stock: product.stock,
    category_id: categoryId,
    brand_id: brandId,
    specs,
    images,
  }
}

function buildSlugCandidates(baseName: string, offerId: string): string[] {
  const idPart = slugify(offerId) || offerId.replace(/[^a-zA-Z0-9_-]/g, '') || 'item'
  const namePart = slugifyName(baseName, '')
  // Always include offerId — bare name slug collides across similar UA titles
  // under concurrent inserts.
  return [
    namePart ? `${namePart}-${idPart}` : `product-${idPart}`,
    `yml-${idPart}`,
    `yml-${idPart}-${Date.now()}`,
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
    // Reserve before the DB round-trip so parallel workers don't pick the same slug.
    reservedSlugs.add(candidate)

    let query = supabase.from('products').select('id').eq('slug', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return candidate

    // Taken in DB already — keep reserved to avoid re-checking, try next candidate.
  }

  const fallback = `yml-${offerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

function previewAction(
  product: ParsedYmlOffer,
  existing: ProductRow | undefined
): { action: ImportPreviewItem['action']; reason?: string; priceChanged: boolean } {
  if (!existing) return { action: 'create', priceChanged: false }

  const specs = buildSpecs(product)
  const images = product.pictures.slice(0, MAX_IMAGES_PER_PRODUCT)
  // Preview cannot cheaply resolve category/brand; compare commercial fields.
  const payload = buildWritePayload(product, existing.category_id ?? '', existing.brand_id, specs, images)
  const priceChanged = pricingNeedsUpdate(existing, payload)
  if (
    !productNeedsUpdate(existing, payload, { ignoreCategoryAndBrand: true })
  ) {
    return { action: 'skip', reason: 'без змін', priceChanged: false }
  }
  return { action: 'update', priceChanged }
}

function previewItem(
  product: ParsedYmlOffer,
  byOfferId: Map<string, ProductRow>,
  categoryLabel: string
): ImportPreviewItem {
  const existing = byOfferId.get(product.offerId)
  const { action, reason } = previewAction(product, existing)
  return {
    dealerCode: product.offerId,
    name: product.name,
    sheet: categoryLabel,
    price: product.price,
    stock: product.stock,
    imageCount: product.pictures.length,
    action,
    reason,
  }
}

export async function buildYmlImportPreview(url: string): Promise<ImportPreview> {
  const parsed = await parseYmlFromUrl(url)
  const supabase = await createServerClient()
  const byOfferId = await loadExistingByOfferId(supabase)

  let toCreate = 0
  let toUpdate = 0
  let unchanged = 0
  let priceChanges = 0
  let priceChangesMatched = 0

  for (const product of parsed.products) {
    const existing = byOfferId.get(product.offerId)
    const { action, priceChanged } = previewAction(product, existing)
    if (action === 'create') toCreate += 1
    else if (action === 'update') toUpdate += 1
    else unchanged += 1
    if (priceChanged) {
      priceChanges += 1
      if (existing) priceChangesMatched += 1
    }
  }

  const sample = parsed.products.slice(0, 20).map(product =>
    previewItem(product, byOfferId, formatCategoryPath(parsed.categories, product.categoryId))
  )

  const usedLeafIds = [...new Set(parsed.products.map(p => p.categoryId))]
  const categories = [
    ...new Set(usedLeafIds.map(id => formatCategoryPath(parsed.categories, id))),
  ].sort((a, b) => a.localeCompare(b, 'uk'))

  return {
    totalParsed: parsed.products.length,
    toCreate,
    toUpdate,
    skipped:
      parsed.skippedOutOfStock +
      parsed.skippedDuplicateId +
      parsed.skippedInvalid +
      unchanged,
    skippedOutOfStock: parsed.skippedOutOfStock,
    skippedDuplicateCode: parsed.skippedDuplicateId,
    priceChanges,
    priceChangesMatched,
    categories,
    sample,
  }
}

export type YmlImportProgress = {
  processed: number
  total: number
  created: number
  updated: number
  skipped: number
}

export async function runYmlImport(
  url: string,
  options?: { onProgress?: (progress: YmlImportProgress) => void }
): Promise<ImportResult> {
  const parsed = await parseYmlFromUrl(url)
  const supabase = await createServerClient()
  const byOfferId = await loadExistingByOfferId(supabase)

  const usedLeafIds = parsed.products.map(product => product.categoryId)
  const categoryIds = await importCategoryTree(supabase, parsed.categories, usedLeafIds)
  const fallbackCache = new Map<string, string>()

  const { data: brands } = await supabase.from('brands').select('id,name,logo_url')
  let knownBrands = (brands ?? []) as Brand[]
  const brandCache = new Map<string, string | null>()
  const reservedSlugs = new Set<string>()

  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    priceUpdates: 0,
    imagesUploaded: 0,
    errors: [],
    total: parsed.products.length,
    processed: 0,
  }

  let processed = 0
  const total = parsed.products.length
  let lastProgressAt = 0

  function emitProgress(force = false) {
    const now = Date.now()
    if (!force && now - lastProgressAt < 400) return
    lastProgressAt = now
    options?.onProgress?.({
      processed,
      total,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
    })
  }

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

  async function resolveProductCategoryId(product: ParsedYmlOffer): Promise<string | null> {
    const feedId =
      resolveFeedCategoryIdAtMaxDepth(parsed.categories, product.categoryId) ?? product.categoryId
    const fromTree = categoryIds.get(feedId)
    if (fromTree) return fromTree
    return ensureFallbackCategory(supabase, feedId, fallbackCache)
  }

  async function insertProduct(
    product: ParsedYmlOffer,
    categoryId: string,
    brandId: string | null,
    specs: Record<string, string>,
    images: string[]
  ): Promise<ProductRow> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < 4; attempt++) {
      const slug = await uniqueSlug(supabase, product.name, product.offerId, reservedSlugs)
      const pricing = dbPricingFromYmlOffer(product)
      const { data: inserted, error } = await supabase
        .from('products')
        .insert({
          slug,
          name_ua: product.name,
          description_ua: product.description || product.name,
          price: pricing.price,
          sale_price: pricing.sale_price,
          stock: product.stock,
          category_id: categoryId,
          brand_id: brandId,
          specs,
          images,
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

  await mapPool(parsed.products, WRITE_CONCURRENCY, async product => {
    try {
      const categoryId = await resolveProductCategoryId(product)
      if (!categoryId) {
        result.errors.push(`${product.offerId}: категорію «${product.categoryName}» не знайдено.`)
        result.skipped += 1
        return
      }

      const brandId = await resolveVendorBrandId(product.vendor)
      const specs = buildSpecs(product)
      const images = product.pictures.slice(0, MAX_IMAGES_PER_PRODUCT)
      const existing = byOfferId.get(product.offerId)
      const payload = buildWritePayload(product, categoryId, brandId, specs, images)

      if (existing) {
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
        result.imagesUploaded += images.length
        return
      }

      const inserted = await insertProduct(product, categoryId, brandId, specs, images)
      byOfferId.set(product.offerId, inserted)
      result.created += 1
      result.imagesUploaded += images.length
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Невідома помилка'
      result.errors.push(`${product.offerId}: ${message}`)
      result.skipped += 1
    } finally {
      processed += 1
      result.processed = processed
      emitProgress()
    }
  })

  emitProgress(true)
  result.errors = result.errors.slice(0, 50)
  return result
}
