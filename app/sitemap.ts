import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/supabase/env'
import { getProductCardsFromDb } from '@/lib/data/catalog-db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const now = new Date()

  let products: Array<{ slug: string; updated_at?: string | null; created_at?: string | null }> = []
  try {
    const cards = await getProductCardsFromDb()
    products = (cards ?? []).map((p: any) => ({ slug: p.slug, updated_at: p.updated_at ?? null, created_at: p.created_at ?? null }))
  } catch {
    products = []
  }

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : (p.created_at ? new Date(p.created_at) : now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}

