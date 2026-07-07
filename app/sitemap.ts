import type { MetadataRoute } from 'next'
import { getCategories, getProductCardsFromDb } from '@/lib/data/catalog-db'
import { getServicesForListing } from '@/lib/data/services-db'
import { safeSlug } from '@/lib/seo/fallbacks'
import { getSiteUrl } from '@/lib/supabase/env'

const STATIC_PAGES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/services', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const now = new Date()

  const [products, services, categories] = await Promise.all([
    getProductCardsFromDb().catch(() => []),
    getServicesForListing().catch(() => []),
    getCategories().catch(() => []),
  ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const serviceEntries: MetadataRoute.Sitemap = services
    .filter(service => safeSlug(service.slug, ''))
    .map(service => ({
      url: `${baseUrl}/services/${safeSlug(service.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

  const productEntries: MetadataRoute.Sitemap = products
    .filter(product => safeSlug(product.slug, ''))
    .map(product => ({
      url: `${baseUrl}/product/${safeSlug(product.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter(category => safeSlug(category.slug, ''))
    .map(category => ({
      url: `${baseUrl}/shop?category=${safeSlug(category.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

  return [...staticEntries, ...serviceEntries, ...categoryEntries, ...productEntries]
}
