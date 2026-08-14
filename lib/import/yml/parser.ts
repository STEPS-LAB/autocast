import {
  allTagContents,
  decodeXmlEntities,
  parseNumber,
  readTextChunks,
  stripHtmlToText,
  tagContent,
} from '@/lib/import/xml/text'
import { enrichMissingCategories } from './category-infer'
import { canonicalizeImportCategoryName } from './category-locale'
import { collectPdfUrlsFromText } from './pdf-text'
import type { ParsedYmlOffer, YmlCategory, YmlParseResult } from './types'

export {
  decodeXmlEntities,
  stripHtmlToText,
} from '@/lib/import/xml/text'

const OFFER_OPEN_RE = /<offer\b[^>]*>/i
const OFFER_CLOSE_RE = /<\/offer>/i
const CATEGORY_RE = /<category\b([^>]*)>([^<]*)<\/category>/gi

function parseCategoryAttributes(attrs: string): {
  id: string | null
  parentId: string | null
  url: string | null
} {
  const id = /\bid="(\d+)"/i.exec(attrs)?.[1] ?? null
  const parentId = /\bparentId="(\d+)"/i.exec(attrs)?.[1] ?? null
  const urlRaw = /\burl="([^"]+)"/i.exec(attrs)?.[1] ?? null
  const url = urlRaw ? decodeXmlEntities(urlRaw).trim() : null
  return { id, parentId, url: url && /^https?:\/\//i.test(url) ? url : null }
}

function parseOfferAttributes(openTag: string): { id: string | null; available: boolean } {
  const idMatch = /\bid="([^"]+)"/i.exec(openTag)
  const availableMatch = /\bavailable="([^"]+)"/i.exec(openTag)
  return {
    id: idMatch?.[1] ?? null,
    available: (availableMatch?.[1] ?? 'false').toLowerCase() === 'true',
  }
}

function parseParams(offerXml: string): Record<string, string> {
  const params: Record<string, string> = {}
  const re = /<param\b[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/param>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(offerXml)) !== null) {
    const name = decodeXmlEntities(match[1] ?? '').trim()
    const value = stripHtmlToText(match[2] ?? '')
    if (name && value) params[name] = value
  }
  return params
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function isImageUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false
  if (/\.pdf(\?|$)/i.test(value)) return false
  return true
}

/** Collect pictures from common YML / Google Merchant / custom tags. */
export function collectOfferPictures(offerXml: string): string[] {
  const tags = ['picture', 'image', 'additional_image_link', 'img', 'gallery_image']
  const seen = new Set<string>()
  const pictures: string[] = []

  for (const tag of tags) {
    for (const raw of allTagContents(offerXml, tag)) {
      const src = decodeXmlEntities(raw).trim()
      if (!isImageUrl(src)) continue
      const key = src.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      pictures.push(src)
    }
  }

  return pictures
}

function collectOfferPdfUrls(offerXml: string, params: Record<string, string>, description: string): string[] {
  const seen = new Set<string>()
  const urls: string[] = []

  function add(raw: string) {
    const src = decodeXmlEntities(raw).trim()
    if (!isHttpUrl(src) || !/\.pdf(\?|$)/i.test(src)) return
    const key = src.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    urls.push(src)
  }

  for (const tag of ['file', 'manual', 'documentation', 'pdf', 'datasheet']) {
    for (const raw of allTagContents(offerXml, tag)) add(raw)
  }

  for (const value of Object.values(params)) {
    for (const url of collectPdfUrlsFromText(value)) add(url)
  }
  for (const url of collectPdfUrlsFromText(description)) add(url)
  for (const url of collectPdfUrlsFromText(offerXml)) add(url)

  return urls
}

function parseStock(offerXml: string, available: boolean): number {
  const stock =
    parseNumber(tagContent(offerXml, 'quantity_in_stock')) ??
    parseNumber(tagContent(offerXml, 'stock_quantity')) ??
    parseNumber(tagContent(offerXml, 'stock')) ??
    (available ? 1 : 0)
  return Math.max(0, Math.floor(stock))
}

export function parseOfferXml(
  offerXml: string,
  categoryById: Map<string, YmlCategory>,
  options?: { skipOutOfStock?: boolean }
): { product: ParsedYmlOffer | null; skipReason: 'oos' | 'invalid' | null } {
  const openTag = OFFER_OPEN_RE.exec(offerXml)?.[0] ?? ''
  const { id: offerId, available } = parseOfferAttributes(openTag)
  if (!offerId) return { product: null, skipReason: 'invalid' }

  // Prefer Ukrainian <name>; never use <name_ru> as primary title.
  const nameRaw = tagContent(offerXml, 'name')
  const name = nameRaw ? stripHtmlToText(nameRaw) : ''
  const price = parseNumber(tagContent(offerXml, 'price'))
  if (!name || price == null || price < 0) {
    return { product: null, skipReason: 'invalid' }
  }

  const stock = parseStock(offerXml, available)
  const skipOutOfStock = options?.skipOutOfStock !== false
  if (skipOutOfStock && stock <= 0) {
    return { product: null, skipReason: 'oos' }
  }

  const categoryId = tagContent(offerXml, 'categoryId')?.trim() || '0'
  const category = categoryById.get(categoryId)
  const categoryName = category?.name?.trim()
    ? canonicalizeImportCategoryName(category.name)
    : `Категорія ${categoryId}`

  const oldPrice = parseNumber(tagContent(offerXml, 'price_old'))
  const vendorCodeRaw = tagContent(offerXml, 'vendorCode')
  const vendorRaw = tagContent(offerXml, 'vendor')
  const urlRaw = tagContent(offerXml, 'url')
  const descriptionRaw = tagContent(offerXml, 'description') ?? ''
  const description = stripHtmlToText(descriptionRaw)
  const params = parseParams(offerXml)
  const pictures = collectOfferPictures(offerXml)
  const pdfUrls = collectOfferPdfUrls(offerXml, params, description)

  return {
    product: {
      offerId,
      available,
      name,
      vendorCode: vendorCodeRaw ? stripHtmlToText(vendorCodeRaw) : null,
      vendor: vendorRaw ? stripHtmlToText(vendorRaw) : null,
      categoryId,
      categoryName,
      price: Math.round(price * 100) / 100,
      oldPrice: oldPrice != null && oldPrice > price ? Math.round(oldPrice * 100) / 100 : null,
      stock,
      description,
      pictures,
      pdfUrls,
      params,
      url: urlRaw ? decodeXmlEntities(urlRaw).trim() : null,
    },
    skipReason: null,
  }
}

function ingestCategories(chunk: string, categoryById: Map<string, YmlCategory>) {
  CATEGORY_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = CATEGORY_RE.exec(chunk)) !== null) {
    const { id, parentId, url } = parseCategoryAttributes(match[1] ?? '')
    if (!id) continue
    const name = canonicalizeImportCategoryName(decodeXmlEntities(match[2] ?? '').trim())
    categoryById.set(id, {
      id,
      parentId,
      name,
      url,
    })
  }
}

export async function parseYmlStream(
  source: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  options?: { skipOutOfStock?: boolean }
): Promise<YmlParseResult> {
  const categoryById = new Map<string, YmlCategory>()
  const products: ParsedYmlOffer[] = []
  const seenIds = new Set<string>()

  let skippedOutOfStock = 0
  let skippedDuplicateId = 0
  let skippedInvalid = 0
  let totalOffers = 0

  let buffer = ''
  let insideOffer = false
  let categoriesClosed = false

  for await (const chunk of readTextChunks(source)) {
    buffer += chunk

    if (!categoriesClosed) {
      ingestCategories(buffer, categoryById)
      if (buffer.includes('</categories>')) {
        categoriesClosed = true
        // Keep a small tail before offers to avoid cutting an open category oddly;
        // offers start after categories in YML.
        const offersAt = buffer.search(/<offers[\s>]/i)
        if (offersAt >= 0) buffer = buffer.slice(offersAt)
        else if (buffer.length > 512_000) buffer = buffer.slice(-64_000)
      } else if (buffer.length > 2_000_000) {
        // Categories section unexpectedly huge — keep sliding window.
        ingestCategories(buffer.slice(-500_000), categoryById)
        buffer = buffer.slice(-250_000)
      }
    }

    while (true) {
      if (!insideOffer) {
        const open = OFFER_OPEN_RE.exec(buffer)
        if (!open || open.index == null) {
          if (buffer.length > 64_000) buffer = buffer.slice(-8_000)
          break
        }
        buffer = buffer.slice(open.index)
        insideOffer = true
        OFFER_OPEN_RE.lastIndex = 0
      }

      const closeMatch = OFFER_CLOSE_RE.exec(buffer)
      if (!closeMatch || closeMatch.index == null) {
        OFFER_CLOSE_RE.lastIndex = 0
        if (buffer.length > 4_000_000) {
          throw new Error('Offer XML занадто великий для парсингу.')
        }
        break
      }

      const end = closeMatch.index + closeMatch[0].length
      const offerXml = buffer.slice(0, end)
      buffer = buffer.slice(end)
      insideOffer = false
      OFFER_CLOSE_RE.lastIndex = 0
      totalOffers += 1

      const { product, skipReason } = parseOfferXml(offerXml, categoryById, options)
      if (skipReason === 'oos') {
        skippedOutOfStock += 1
        continue
      }
      if (skipReason === 'invalid' || !product) {
        skippedInvalid += 1
        continue
      }
      if (seenIds.has(product.offerId)) {
        skippedDuplicateId += 1
        continue
      }
      seenIds.add(product.offerId)
      products.push(product)
    }
  }

  const enriched = enrichMissingCategories([...categoryById.values()], products)

  return {
    categories: enriched.categories,
    products: enriched.products,
    skippedOutOfStock,
    skippedDuplicateId,
    skippedInvalid,
    totalOffers,
  }
}

export async function parseYmlFromUrl(
  url: string,
  options?: { skipOutOfStock?: boolean }
): Promise<YmlParseResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AutocastImporter/1.0',
      Accept: 'application/xml,text/xml,*/*',
    },
    signal: AbortSignal.timeout(240_000),
  })

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити фід (HTTP ${response.status}).`)
  }
  if (!response.body) {
    throw new Error('Порожня відповідь фіду.')
  }

  return parseYmlStream(response.body, options)
}
