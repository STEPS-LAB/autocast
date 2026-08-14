import { canonicalizeImportCategoryName } from '@/lib/import/yml/category-locale'
import type { YmlCategory } from '@/lib/import/yml/types'
import {
  allTagContents,
  decodeXmlEntities,
  parseNumber,
  readTextChunks,
  stripHtmlToText,
  tagContent,
} from '@/lib/import/xml/text'
import type {
  CaralarmAvailabilityStatus,
  CaralarmFeedDialect,
  CaralarmOffer,
  CaralarmParseResult,
} from './types'
import { EXPORT_FEED_DIALECT, MARKET_FEED_DIALECT } from './types'

const OFFER_OPEN_RE = /<offer\b[^>]*>/i
const OFFER_CLOSE_RE = /<\/offer>/i
const CATEGORY_RE = /<category\b([^>]*)>([^<]*)<\/category>/gi

function parseCategoryAttributes(attrs: string): {
  id: string | null
  parentId: string | null
} {
  const id = /\bid="(\d+)"/i.exec(attrs)?.[1] ?? null
  const parentId = /\bparentId="(\d+)"/i.exec(attrs)?.[1] ?? null
  return { id, parentId }
}

function ingestCategories(chunk: string, categoryById: Map<string, YmlCategory>) {
  CATEGORY_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = CATEGORY_RE.exec(chunk)) !== null) {
    const { id, parentId } = parseCategoryAttributes(match[1] ?? '')
    if (!id) continue
    const name = canonicalizeImportCategoryName(decodeXmlEntities(match[2] ?? '').trim())
    categoryById.set(id, {
      id,
      parentId,
      name,
      url: null,
    })
  }
}

function parseAvailableStatus(raw: string): CaralarmAvailabilityStatus | null {
  const n = Number(raw.trim())
  if (n === 0 || n === 1 || n === 2 || n === 3) return n
  return null
}

function parseOfferOpenAttrs(
  openTag: string,
  dialect: CaralarmFeedDialect
): {
  id: string | null
  availableRaw: string
  availableStatus: CaralarmAvailabilityStatus | null
  available: boolean
} {
  const id = /\bid="([^"]+)"/i.exec(openTag)?.[1] ?? null
  const availableRaw = /\bavailable="([^"]*)"/i.exec(openTag)?.[1] ?? ''
  if (dialect.availableFrom === 'boolean') {
    const available = availableRaw.toLowerCase() === 'true'
    return { id, availableRaw, availableStatus: null, available }
  }
  const availableStatus = parseAvailableStatus(availableRaw)
  const available = availableStatus === 1 || availableStatus === 3
  return { id, availableRaw, availableStatus, available }
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

function collectPictures(offerXml: string): string[] {
  const seen = new Set<string>()
  const pictures: string[] = []
  for (const raw of allTagContents(offerXml, 'picture')) {
    const src = decodeXmlEntities(raw).trim()
    if (!/^https?:\/\//i.test(src)) continue
    if (/\.pdf(\?|$)/i.test(src)) continue
    const key = src.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    pictures.push(src)
  }
  return pictures
}

function categoryNameFromMap(
  categoryById: Map<string, YmlCategory>,
  categoryId: string,
  fallbackName: string | null
): string {
  const fromTree = categoryById.get(categoryId)?.name?.trim()
  if (fromTree) return canonicalizeImportCategoryName(fromTree)
  if (fallbackName?.trim()) return canonicalizeImportCategoryName(fallbackName.trim())
  return `Категорія ${categoryId}`
}

export function parseCaralarmOfferXml(
  offerXml: string,
  categoryById: Map<string, YmlCategory>,
  dialect: CaralarmFeedDialect
): CaralarmOffer | null {
  const openTag = OFFER_OPEN_RE.exec(offerXml)?.[0] ?? ''
  const { id: offerId, availableRaw, availableStatus, available } = parseOfferOpenAttrs(
    openTag,
    dialect
  )
  if (!offerId) return null

  const nameRaw = tagContent(offerXml, 'name')
  const name = nameRaw ? stripHtmlToText(nameRaw) : ''
  if (!name) return null

  const categoryId =
    tagContent(offerXml, dialect.categoryTag)?.trim() ||
    tagContent(offerXml, 'categoryId')?.trim() ||
    tagContent(offerXml, 'categoryID')?.trim() ||
    '0'

  const categoryNameRaw = tagContent(offerXml, 'categoryName')
  const categoryName = categoryNameFromMap(
    categoryById,
    categoryId,
    categoryNameRaw ? stripHtmlToText(categoryNameRaw) : null
  )

  const codeRaw = tagContent(offerXml, dialect.codeTag)
  const vendorRaw = tagContent(offerXml, 'vendor')
  const urlRaw = tagContent(offerXml, 'url')
  const descriptionRaw = tagContent(offerXml, 'description') ?? ''
  const descriptionShortRaw = tagContent(offerXml, 'description_short') ?? ''

  return {
    offerId,
    availableRaw,
    availableStatus,
    available,
    name,
    productCode: codeRaw ? stripHtmlToText(codeRaw) : null,
    vendor: vendorRaw ? stripHtmlToText(vendorRaw) : null,
    categoryId,
    categoryName,
    priceUsd: parseNumber(tagContent(offerXml, 'priceUSD')),
    priceUah: parseNumber(tagContent(offerXml, 'priceUAH')),
    priceMinUsd: parseNumber(tagContent(offerXml, 'priceMinUSD')),
    priceMinUah: parseNumber(tagContent(offerXml, 'priceMinUAH')),
    currencyId: tagContent(offerXml, 'currencyId')?.trim() || null,
    description: stripHtmlToText(descriptionRaw),
    descriptionShort: stripHtmlToText(descriptionShortRaw),
    pictures: collectPictures(offerXml),
    params: parseParams(offerXml),
    url: urlRaw ? decodeXmlEntities(urlRaw).trim() : null,
  }
}

export async function parseCaralarmStream(
  source: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  dialect: CaralarmFeedDialect
): Promise<CaralarmParseResult> {
  const categoryById = new Map<string, YmlCategory>()
  const offers: CaralarmOffer[] = []
  const seenIds = new Set<string>()

  let skippedInvalid = 0
  let skippedDuplicateId = 0
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
        const offersAt = buffer.search(/<offers[\s>]/i)
        if (offersAt >= 0) buffer = buffer.slice(offersAt)
        else if (buffer.length > 512_000) buffer = buffer.slice(-64_000)
      } else if (buffer.length > 2_000_000) {
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

      const offer = parseCaralarmOfferXml(offerXml, categoryById, dialect)
      if (!offer) {
        skippedInvalid += 1
        continue
      }
      if (seenIds.has(offer.offerId)) {
        skippedDuplicateId += 1
        continue
      }
      seenIds.add(offer.offerId)
      offers.push(offer)
    }
  }

  return {
    categories: [...categoryById.values()],
    offers,
    skippedInvalid,
    skippedDuplicateId,
    totalOffers,
  }
}

export async function parseCaralarmFromUrl(
  url: string,
  dialect: CaralarmFeedDialect
): Promise<CaralarmParseResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AutocastCaralarmImporter/1.0',
      Accept: 'application/xml,text/xml,*/*',
    },
    signal: AbortSignal.timeout(300_000),
  })

  if (!response.ok) {
    throw new Error(`Не вдалося завантажити фід Caralarm (HTTP ${response.status}).`)
  }
  if (!response.body) {
    throw new Error('Порожня відповідь фіду Caralarm.')
  }

  return parseCaralarmStream(response.body, dialect)
}

export async function parseCaralarmMarketFromUrl(url: string): Promise<CaralarmParseResult> {
  return parseCaralarmFromUrl(url, MARKET_FEED_DIALECT)
}

export async function parseCaralarmExportFromUrl(url: string): Promise<CaralarmParseResult> {
  return parseCaralarmFromUrl(url, EXPORT_FEED_DIALECT)
}

export async function parseCaralarmFromString(
  xml: string,
  dialect: CaralarmFeedDialect
): Promise<CaralarmParseResult> {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(xml))
      controller.close()
    },
  })
  return parseCaralarmStream(stream, dialect)
}
