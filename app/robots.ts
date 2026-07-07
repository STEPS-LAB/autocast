import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/supabase/env'

/** AI/LLM crawlers explicitly allowed for GEO (Generative Engine Optimization). */
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'PerplexityBot',
  'Anthropic-ai',
  'Claude-Web',
  'Applebot-Extended',
  'cohere-ai',
  'Bytespider',
  'CCBot',
] as const

const DISALLOWED_PATHS = ['/admin', '/api', '/auth', '/account', '/cart', '/checkout', '/login', '/register', '/forgot-password', '/reset-password']

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      ...AI_CRAWLERS.map(userAgent => ({
        userAgent,
        allow: '/' as const,
        disallow: DISALLOWED_PATHS,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
