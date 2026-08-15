import { decodeXmlEntities } from '@/lib/import/xml/text'

const IMAGE_TAGS = [
  'picture',
  'image',
  'additional_image_link',
  'img',
  'gallery_image',
  'image_link',
  'g:image_link',
] as const

const TAG_GROUP = IMAGE_TAGS.map(tag => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

export function normalizeImageUrl(raw: string): string | null {
  let src = decodeXmlEntities(raw).trim()
  if (!src) return null
  if (src.startsWith('//')) src = `https:${src}`
  if (!/^https?:\/\//i.test(src)) return null
  if (/\.pdf(\?|$)/i.test(src)) return null
  try {
    const url = new URL(src)
    url.pathname = url.pathname.replace(/ /g, '%20')
    return url.toString()
  } catch {
    return src.replace(/ /g, '%20')
  }
}

function pushUrl(seen: Set<string>, out: string[], raw: string) {
  const src = normalizeImageUrl(raw)
  if (!src) return
  const key = src.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  out.push(src)
}

function collectInnerTextUrls(xml: string, seen: Set<string>, out: string[]) {
  const re = new RegExp(`<(${TAG_GROUP})(?:\\s[^>]*)?>([\\s\\S]*?)</\\1>`, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    const inner = decodeXmlEntities(match[2] ?? '').trim()
    if (!inner) continue
    pushUrl(seen, out, inner)
    const imgSrc = /\bsrc=["']([^"']+)["']/i.exec(inner)
    if (imgSrc?.[1]) pushUrl(seen, out, imgSrc[1])
  }
}

function collectAttributeUrls(xml: string, seen: Set<string>, out: string[]) {
  const re = new RegExp(
    `<(?:${TAG_GROUP})\\b[^>]*\\b(?:src|url|href)=["']([^"']+)["'][^>]*\\/?>`,
    'gi'
  )
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    if (match[1]) pushUrl(seen, out, match[1])
  }
}

function collectHtmlImgUrls(xml: string, seen: Set<string>, out: string[]) {
  const re = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    if (match[1]) pushUrl(seen, out, match[1])
  }
}

/** Collect pictures from YML / Merchant / HTML-in-CDATA offer markup. */
export function collectOfferPictures(offerXml: string): string[] {
  const seen = new Set<string>()
  const pictures: string[] = []
  collectInnerTextUrls(offerXml, seen, pictures)
  collectAttributeUrls(offerXml, seen, pictures)
  collectHtmlImgUrls(offerXml, seen, pictures)
  return pictures
}

/**
 * Group year/trim variants of the same head unit so a photo on one offer
 * can fill siblings that the feed shipped without <picture>.
 */
export function pictureShareKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\b\d{4}\s*-\s*\d{4}\b/g, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/[^a-zа-яіїєґ0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Prefer feed photos; never replace existing photos with an empty list. */
export function coalesceImportImages(
  feedPictures: string[],
  existingImages: string[] | null | undefined,
  sharedPictures: string[] | undefined,
  maxImages: number
): string[] {
  if (feedPictures.length > 0) return feedPictures.slice(0, maxImages)
  const existing = (existingImages ?? []).filter(url => typeof url === 'string' && url.length > 0)
  if (existing.length > 0) return existing.slice(0, maxImages)
  if (sharedPictures && sharedPictures.length > 0) return sharedPictures.slice(0, maxImages)
  return []
}
