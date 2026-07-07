import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/supabase/env'
import { defaultSiteDescription, INDEX_ROBOTS, safeText } from '@/lib/seo/fallbacks'
import { BUSINESS, DEFAULT_OG_IMAGE, KEYWORD_CLUSTERS, SITE_LOCALE, SITE_NAME } from '@/lib/seo/site'

export function truncateDescription(text: string, maxLength = 160): string {
  const normalized = safeText(text, defaultSiteDescription()).replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const slice = normalized.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  return `${(lastSpace > 100 ? slice.slice(0, lastSpace) : slice).trim()}…`
}

export function absoluteUrl(path: string, siteUrl?: string): string {
  const base = siteUrl ?? getSiteUrl()
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function resolveOgImage(image?: string | null, siteUrl?: string): string {
  const base = siteUrl ?? getSiteUrl()
  const src = image?.trim() || DEFAULT_OG_IMAGE
  return absoluteUrl(src, base)
}

export function buildServiceTitle(serviceName: string): string {
  const name = safeText(serviceName, 'Автопослуга')
  return `${name} у Житомирі`
}

export function buildProductTitle(productName: string): string {
  return safeText(productName, 'Товар Autocast')
}

export function buildCanonical(path: string, siteUrl?: string): string {
  return absoluteUrl(path, siteUrl)
}

export function buildPageMetadata(input: {
  title: string
  description: string
  path: string
  image?: string | null
  keywords?: readonly string[]
}): Metadata {
  const siteUrl = getSiteUrl()
  const url = buildCanonical(input.path, siteUrl)
  const title = safeText(input.title, `${SITE_NAME} — Автоелектроніка та послуги в Житомирі`)
  const description = truncateDescription(input.description)
  const ogImage = resolveOgImage(input.image, siteUrl)
  const keywords = (input.keywords ?? []).filter(Boolean)

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : [...KEYWORD_CLUSTERS.localServices.slice(0, 6), ...KEYWORD_CLUSTERS.nationalShop.slice(0, 4)],
    alternates: { canonical: url },
    robots: INDEX_ROBOTS,
    openGraph: {
      type: 'website',
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const title = `${SITE_NAME} — Автоелектроніка та послуги в Житомирі`
  const description = truncateDescription(BUSINESS.description)
  const ogImage = resolveOgImage(DEFAULT_OG_IMAGE, siteUrl)

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords: [...KEYWORD_CLUSTERS.localServices, ...KEYWORD_CLUSTERS.nationalShop],
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'automotive',
    alternates: {
      canonical: siteUrl,
      languages: { 'uk-UA': siteUrl },
    },
    robots: { ...INDEX_ROBOTS, googleBot: INDEX_ROBOTS },
    openGraph: {
      type: 'website',
      locale: SITE_LOCALE,
      url: siteUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    manifest: '/manifest.json',
    other: {
      'geo.region': BUSINESS.geo.regionCode,
      'geo.placename': BUSINESS.geo.placename,
      'geo.position': `${BUSINESS.geo.latitude};${BUSINESS.geo.longitude}`,
      ICBM: `${BUSINESS.geo.latitude}, ${BUSINESS.geo.longitude}`,
      'content-language': 'uk',
    },
    icons: {
      icon: [{ url: '/images/mk.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/images/mk.svg', type: 'image/svg+xml' }],
    },
  }
}
