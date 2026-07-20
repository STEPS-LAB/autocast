import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getSupabaseUrl } from '@/lib/supabase/env'
import { slugify, slugifyName } from '@/lib/utils'
import { resolveExcelCategoryIds } from './categories'
import { parseExcelWorkbook } from './parser'
import {
  DEALER_CODE_SPEC_KEY,
  type ImportPreview,
  type ImportPreviewItem,
  type ImportResult,
  type ParsedExcelProduct,
} from './types'

const BUCKET_NAME = 'product-images'
const MAX_IMAGES_PER_PRODUCT = 10

type ProductRow = {
  id: string
  slug: string
  name_ua: string
  specs: Record<string, string> | null
}

function buildSpecs(product: ParsedExcelProduct): Record<string, string> {
  const specs: Record<string, string> = {
    [DEALER_CODE_SPEC_KEY]: product.dealerCode,
  }
  if (product.warranty) specs['Гарантія'] = product.warranty
  if (product.note) specs['Примітка'] = product.note
  if (product.stockLabel) specs['Наявність'] = product.stockLabel
  if (product.dealerPrice2 != null) specs['Дил 2'] = String(product.dealerPrice2)
  if (product.dealerPrice != null) specs['Дил'] = String(product.dealerPrice)
  if (product.wholesalePrice != null) specs['Гурт'] = String(product.wholesalePrice)
  return specs
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

async function getServiceClient() {
  const supabaseUrl = getSupabaseUrl()
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role не налаштований.')
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey)
}

async function ensureBucket(serviceClient: SupabaseClient) {
  const { data: buckets } = await serviceClient.storage.listBuckets()
  const hasBucket = (buckets ?? []).some(bucket => bucket.name === BUCKET_NAME)
  if (hasBucket) return

  const { error } = await serviceClient.storage.createBucket(BUCKET_NAME, { public: true })
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message)
  }
}

async function uploadImage(
  serviceClient: SupabaseClient,
  productId: string,
  image: { buffer: Buffer; extension: string }
): Promise<string | null> {
  const ext = image.extension.replace(/^\./, '') || 'jpg'
  const path = `${productId}/import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await serviceClient.storage.from(BUCKET_NAME).upload(path, image.buffer, {
    upsert: true,
    contentType: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg',
  })

  if (error) return null
  const { data } = serviceClient.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

async function loadExistingProducts(supabase: SupabaseClient): Promise<{
  byCode: Map<string, ProductRow>
  byName: Map<string, ProductRow>
}> {
  const { data } = await supabase.from('products').select('id,slug,name_ua,specs')
  const byCode = new Map<string, ProductRow>()
  const byName = new Map<string, ProductRow>()

  for (const row of (data ?? []) as ProductRow[]) {
    const code = row.specs?.[DEALER_CODE_SPEC_KEY]
    if (code) byCode.set(code, row)
    byName.set(normalizeName(row.name_ua), row)
  }

  return { byCode, byName }
}

async function uniqueSlug(
  supabase: SupabaseClient,
  baseName: string,
  dealerCode: string,
  excludeId?: string
): Promise<string> {
  const candidates = [
    slugifyName(baseName, ''),
    slugifyName(`${baseName}-${dealerCode}`, ''),
    slugify(dealerCode) || slugifyName(dealerCode, ''),
  ].filter(Boolean)

  for (const candidate of candidates) {
    let query = supabase.from('products').select('id').eq('slug', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return candidate
  }

  return `${slugify(dealerCode) || 'product'}-${Date.now()}`
}

function previewAction(
  product: ParsedExcelProduct,
  byCode: Map<string, ProductRow>
): ImportPreviewItem {
  const existing = byCode.get(product.dealerCode)
  return {
    dealerCode: product.dealerCode,
    name: product.name,
    sheet: product.sheet,
    price: product.price,
    stock: product.stock,
    imageCount: product.images.length,
    action: existing ? 'update' : 'create',
  }
}

export async function buildExcelImportPreview(buffer: Buffer): Promise<ImportPreview> {
  const parsed = await parseExcelWorkbook(buffer)
  const supabase = await createServerClient()
  const { byCode, byName } = await loadExistingProducts(supabase)

  const sample = parsed.products.slice(0, 20).map(product => previewAction(product, byCode))
  const toCreate = parsed.products.filter(product => !byCode.has(product.dealerCode)).length
  const toUpdate = parsed.products.length - toCreate

  let priceChangesMatched = 0
  for (const change of parsed.priceChanges) {
    const normalized = normalizeName(change.name)
    if (byName.has(normalized)) priceChangesMatched++
  }

  return {
    totalParsed: parsed.products.length,
    toCreate,
    toUpdate,
    skipped: parsed.skippedOutOfStock + parsed.skippedDuplicateCode,
    skippedOutOfStock: parsed.skippedOutOfStock,
    skippedDuplicateCode: parsed.skippedDuplicateCode,
    priceChanges: parsed.priceChanges.length,
    priceChangesMatched,
    categories: [...new Set(parsed.products.map(p => p.sheet))].sort((a, b) =>
      a.localeCompare(b, 'uk')
    ),
    sample,
  }
}

export async function runExcelImport(buffer: Buffer): Promise<ImportResult> {
  const parsed = await parseExcelWorkbook(buffer)
  const supabase = await createServerClient()
  const serviceClient = await getServiceClient()
  await ensureBucket(serviceClient)

  const sheetsUsed = [...new Set(parsed.products.map(p => p.sheet))]
  const categoryIds = await resolveExcelCategoryIds(supabase, sheetsUsed)
  const { byCode, byName } = await loadExistingProducts(supabase)

  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    priceUpdates: 0,
    imagesUploaded: 0,
    errors: [],
  }

  for (const product of parsed.products) {
    try {
      const categoryId = categoryIds.get(product.sheet)
      if (!categoryId) {
        result.errors.push(`${product.dealerCode}: категорію «${product.sheet}» не знайдено.`)
        result.skipped++
        continue
      }

      const specs = buildSpecs(product)
      const existing = byCode.get(product.dealerCode)
      let productId = existing?.id

      if (existing) {
        const { error } = await supabase
          .from('products')
          .update({
            name_ua: product.name,
            description_ua: product.description,
            price: product.price,
            stock: product.stock,
            category_id: categoryId,
            specs,
          })
          .eq('id', existing.id)

        if (error) throw new Error(error.message)
        productId = existing.id
        result.updated++
      } else {
        const slug = await uniqueSlug(supabase, product.name, product.dealerCode)
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({
            slug,
            name_ua: product.name,
            description_ua: product.description,
            price: product.price,
            stock: product.stock,
            category_id: categoryId,
            brand_id: null,
            specs,
            images: [],
            sale_price: null,
            is_featured: false,
          })
          .select('id,slug,name_ua,specs')
          .single()

        if (error || !inserted) throw new Error(error?.message ?? 'Не вдалося створити товар.')
        productId = inserted.id
        byCode.set(product.dealerCode, inserted as ProductRow)
        byName.set(normalizeName(product.name), inserted as ProductRow)
        result.created++
      }

      if (!productId) continue

      const imageUrls: string[] = []
      for (const image of product.images.slice(0, MAX_IMAGES_PER_PRODUCT)) {
        const url = await uploadImage(serviceClient, productId, image)
        if (url) {
          imageUrls.push(url)
          result.imagesUploaded++
        }
      }

      if (imageUrls.length > 0) {
        const { error: imageError } = await supabase
          .from('products')
          .update({ images: imageUrls })
          .eq('id', productId)
        if (imageError) {
          result.errors.push(`${product.dealerCode}: фото — ${imageError.message}`)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Невідома помилка'
      result.errors.push(`${product.dealerCode}: ${message}`)
      result.skipped++
    }
  }

  for (const change of parsed.priceChanges) {
    const normalized = normalizeName(change.name)
    const existing = byName.get(normalized)
    const newPrice = change.newRetailPrice
    if (!existing || newPrice == null) continue

    const { error } = await supabase
      .from('products')
      .update({ price: Math.round(newPrice * 100) / 100 })
      .eq('id', existing.id)

    if (error) {
      result.errors.push(`Ціна «${change.name}»: ${error.message}`)
      continue
    }
    result.priceUpdates++
  }

  return result
}
