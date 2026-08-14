import { createClient as createServerClient } from '@/lib/supabase/server'
import { resolveBrandId } from '@/lib/admin/resolve-brand'
import { fetchAllCategories } from '@/lib/data/categories'
import { slugify, slugifyName } from '@/lib/utils'
import { ensureNamedCategory, importCategoryTree } from './category-import'
import {
  type CategoryMatchCandidate,
} from './category-match'
import { formatCategoryPath, resolveFeedCategoryIdAtMaxDepth } from './category-tree'
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

export { ensureNamedCategory, importCategoryTree } from './category-import'

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

function createLimiter(concurrency: number) {
  let active = 0
  const waiting: Array<() => void> = []

  async function acquire() {
    if (active >= concurrency) {
      await new Promise<void>(resolve => waiting.push(resolve))
    }
    active += 1
  }

  function release() {
    active -= 1
    waiting.shift()?.()
  }

  return {
    async run<T>(fn: () => Promise<T>): Promise<T> {
      await acquire()
      try {
        return await fn()
      } finally {
        release()
      }
    },
  }
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
  const supabase = await createServerClient()
  const byOfferId = await loadExistingByOfferId(supabase)

  let toCreate = 0
  let toUpdate = 0
  let unchanged = 0
  let priceChanges = 0
  let priceChangesMatched = 0
  const sample: ImportPreviewItem[] = []
  const usedLeafIds = new Set<string>()
  let categories: YmlCategory[] = []

  const parsed = await parseYmlFromUrl(url, {
    collectProducts: false,
    skipPdfUrls: true,
    onCategories: cats => {
      categories = cats
    },
    onProduct: product => {
      usedLeafIds.add(product.categoryId)
      const existing = byOfferId.get(product.offerId)
      const { action, priceChanged } = previewAction(product, existing)
      if (action === 'create') toCreate += 1
      else if (action === 'update') toUpdate += 1
      else unchanged += 1
      if (priceChanged) {
        priceChanges += 1
        if (existing) priceChangesMatched += 1
      }
      if (sample.length < 20) {
        sample.push(previewItem(product, byOfferId, formatCategoryPath(categories, product.categoryId)))
      }
    },
  })

  const categoryLabels = [...new Set([...usedLeafIds].map(id => formatCategoryPath(categories, id)))]
    .filter(label => !/^категорія\s+\d+$/i.test(label))
    .sort((a, b) => a.localeCompare(b, 'uk'))

  return {
    totalParsed: toCreate + toUpdate + unchanged,
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
    categories: categoryLabels,
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
  options?: {
    onProgress?: (progress: YmlImportProgress) => void
    expectedTotal?: number
  }
): Promise<ImportResult> {
  const supabase = await createServerClient()
  const byOfferId = await loadExistingByOfferId(supabase)

  let feedCategories: YmlCategory[] = []
  let categoryIds = new Map<string, string>()
  const fallbackCache = new Map<string, string>()
  const { data: allCats } = await fetchAllCategories(supabase, 'id,name_ua,parent_id')
  const matchCandidates: CategoryMatchCandidate[] = (allCats ?? []).map(row => ({
    id: String(row.id),
    nameUa: String(row.name_ua),
    parentId: (row.parent_id as string | null) ?? null,
  }))

  const { data: brands } = await supabase.from('brands').select('id,name,logo_url')
  let knownBrands = (brands ?? []) as Brand[]
  const brandCache = new Map<string, string | null>()
  const reservedSlugs = new Set<string>()
  const writePool = createLimiter(WRITE_CONCURRENCY)
  const expectedTotalRaw = options?.expectedTotal
  const expectedTotal = Number.isFinite(expectedTotalRaw)
    ? Math.max(0, Math.floor(expectedTotalRaw as number))
    : 0

  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    priceUpdates: 0,
    imagesUploaded: 0,
    errors: [],
    total: expectedTotal,
    processed: 0,
  }

  let processed = 0
  let lastProgressAt = 0

  function emitProgress(force = false) {
    const now = Date.now()
    if (!force && now - lastProgressAt < 400) return
    lastProgressAt = now
    options?.onProgress?.({
      processed,
      total: expectedTotal > 0 ? expectedTotal : processed,
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
      resolveFeedCategoryIdAtMaxDepth(feedCategories, product.categoryId) ?? product.categoryId
    const fromTree = categoryIds.get(feedId)
    if (fromTree) return fromTree
    return ensureNamedCategory(
      supabase,
      product.categoryName || 'Інше',
      fallbackCache,
      matchCandidates
    )
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

  async function writeProduct(product: ParsedYmlOffer) {
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
      if (expectedTotal === 0) result.total = processed
      emitProgress()
    }
  }

  await parseYmlFromUrl(url, {
    collectProducts: false,
    onCategories: async cats => {
      feedCategories = cats
      categoryIds = await importCategoryTree(
        supabase,
        cats,
        cats.map(category => category.id)
      )
    },
    onProduct: product => writePool.run(() => writeProduct(product)),
  })

  result.total = expectedTotal > 0 ? expectedTotal : processed
  emitProgress(true)
  result.errors = result.errors.slice(0, 50)
  return result
}
