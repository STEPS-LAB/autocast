import { createClient as createServerClient } from '@/lib/supabase/server'
import { resolveBrandId } from '@/lib/admin/resolve-brand'
import { slugify } from '@/lib/utils'
import { parseTorssenYmlFromUrl } from './parser'
import {
  TORSSEN_OFFER_ID_SPEC_KEY,
  TORSSEN_SOURCE_URL_SPEC_KEY,
  TORSSEN_VENDOR_CODE_SPEC_KEY,
  type ImportPreview,
  type ImportPreviewItem,
  type ImportResult,
  type ParsedTorssenOffer,
} from './types'
import type { Brand } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_IMAGES_PER_PRODUCT = 10
const WRITE_CONCURRENCY = 8

type ProductRow = {
  id: string
  slug: string
  name_ua: string
  specs: Record<string, string> | null
}

function buildSpecs(product: ParsedTorssenOffer): Record<string, string> {
  const specs: Record<string, string> = {
    [TORSSEN_OFFER_ID_SPEC_KEY]: product.offerId,
    ...product.params,
  }
  if (product.vendorCode) specs[TORSSEN_VENDOR_CODE_SPEC_KEY] = product.vendorCode
  if (product.url) specs[TORSSEN_SOURCE_URL_SPEC_KEY] = product.url
  return specs
}

async function resolveCategoryIds(
  supabase: SupabaseClient,
  categoryNames: string[]
): Promise<Map<string, string>> {
  const uniqueNames = [...new Set(categoryNames.map(name => name.trim()).filter(Boolean))]
  const map = new Map<string, string>()
  if (uniqueNames.length === 0) return map

  const { data: existing } = await supabase
    .from('categories')
    .select('id,name_ua,slug')
    .in('name_ua', uniqueNames)

  for (const row of existing ?? []) {
    map.set(row.name_ua, row.id)
  }

  let sortOrder = 200
  for (const name of uniqueNames) {
    if (map.has(name)) continue
    const slug = slugify(name) || `category-${sortOrder}`
    const { data: inserted, error } = await supabase
      .from('categories')
      .insert({
        slug,
        name_ua: name,
        parent_id: null,
        image_url: null,
        sort_order: sortOrder,
      })
      .select('id,name_ua')
      .single()

    sortOrder += 1

    if (error) {
      const { data: bySlug } = await supabase
        .from('categories')
        .select('id,name_ua')
        .eq('slug', slug)
        .maybeSingle()
      if (bySlug) map.set(name, bySlug.id)
      continue
    }
    if (inserted) map.set(inserted.name_ua, inserted.id)
  }

  return map
}

async function loadExistingByOfferId(supabase: SupabaseClient): Promise<Map<string, ProductRow>> {
  const byOfferId = new Map<string, ProductRow>()
  const { data } = await supabase.from('products').select('id,slug,name_ua,specs')
  for (const row of (data ?? []) as ProductRow[]) {
    const offerId = row.specs?.[TORSSEN_OFFER_ID_SPEC_KEY]
    if (offerId) byOfferId.set(offerId, row)
  }
  return byOfferId
}

async function uniqueSlug(
  supabase: SupabaseClient,
  baseName: string,
  offerId: string,
  excludeId?: string
): Promise<string> {
  const candidates = [
    slugify(baseName),
    slugify(`${baseName}-${offerId}`),
    slugify(`torssen-${offerId}`),
  ].filter(Boolean)

  for (const candidate of candidates) {
    let query = supabase.from('products').select('id').eq('slug', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return candidate
  }

  return `torssen-${offerId}-${Date.now()}`
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

function previewItem(
  product: ParsedTorssenOffer,
  byOfferId: Map<string, ProductRow>
): ImportPreviewItem {
  return {
    dealerCode: product.offerId,
    name: product.name,
    sheet: product.categoryName,
    price: product.price,
    stock: product.stock,
    imageCount: product.pictures.length,
    action: byOfferId.has(product.offerId) ? 'update' : 'create',
  }
}

export async function buildTorssenImportPreview(url: string): Promise<ImportPreview> {
  const parsed = await parseTorssenYmlFromUrl(url)
  const supabase = await createServerClient()
  const byOfferId = await loadExistingByOfferId(supabase)

  const sample = parsed.products.slice(0, 20).map(product => previewItem(product, byOfferId))
  const toCreate = parsed.products.filter(product => !byOfferId.has(product.offerId)).length
  const toUpdate = parsed.products.length - toCreate
  const categories = [...new Set(parsed.products.map(product => product.categoryName))].sort(
    (a, b) => a.localeCompare(b, 'uk')
  )

  return {
    totalParsed: parsed.products.length,
    toCreate,
    toUpdate,
    skipped: parsed.skippedOutOfStock + parsed.skippedDuplicateId + parsed.skippedInvalid,
    skippedOutOfStock: parsed.skippedOutOfStock,
    skippedDuplicateCode: parsed.skippedDuplicateId,
    priceChanges: 0,
    priceChangesMatched: 0,
    categories,
    sample,
  }
}

export async function runTorssenImport(url: string): Promise<ImportResult> {
  const parsed = await parseTorssenYmlFromUrl(url)
  const supabase = await createServerClient()
  const byOfferId = await loadExistingByOfferId(supabase)

  const categoryIds = await resolveCategoryIds(
    supabase,
    parsed.products.map(product => product.categoryName)
  )

  const { data: brands } = await supabase.from('brands').select('id,name,logo_url')
  let knownBrands = (brands ?? []) as Brand[]
  const brandCache = new Map<string, string | null>()

  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    priceUpdates: 0,
    imagesUploaded: 0,
    errors: [],
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

  await mapPool(parsed.products, WRITE_CONCURRENCY, async product => {
    try {
      const categoryId = categoryIds.get(product.categoryName)
      if (!categoryId) {
        result.errors.push(`${product.offerId}: категорію «${product.categoryName}» не знайдено.`)
        result.skipped += 1
        return
      }

      const brandId = await resolveVendorBrandId(product.vendor)
      const specs = buildSpecs(product)
      const images = product.pictures.slice(0, MAX_IMAGES_PER_PRODUCT)
      const existing = byOfferId.get(product.offerId)

      if (existing) {
        const { error } = await supabase
          .from('products')
          .update({
            name_ua: product.name,
            description_ua: product.description || product.name,
            price: product.price,
            sale_price: product.oldPrice,
            stock: product.stock,
            category_id: categoryId,
            brand_id: brandId,
            specs,
            images,
          })
          .eq('id', existing.id)

        if (error) throw new Error(error.message)
        result.updated += 1
        result.imagesUploaded += images.length
        return
      }

      const slug = await uniqueSlug(supabase, product.name, product.offerId)
      const { data: inserted, error } = await supabase
        .from('products')
        .insert({
          slug,
          name_ua: product.name,
          description_ua: product.description || product.name,
          price: product.price,
          sale_price: product.oldPrice,
          stock: product.stock,
          category_id: categoryId,
          brand_id: brandId,
          specs,
          images,
          is_featured: false,
        })
        .select('id,slug,name_ua,specs')
        .single()

      if (error || !inserted) throw new Error(error?.message ?? 'Не вдалося створити товар.')
      byOfferId.set(product.offerId, inserted as ProductRow)
      result.created += 1
      result.imagesUploaded += images.length
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Невідома помилка'
      result.errors.push(`${product.offerId}: ${message}`)
      result.skipped += 1
    }
  })

  return result
}
