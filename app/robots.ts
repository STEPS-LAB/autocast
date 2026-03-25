import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/supabase/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

