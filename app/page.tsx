import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import HomePageDynamicSections from '@/components/home/HomePageDynamicSections'
import { JsonLdGraph } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { buildLocalBusinessSchema, buildWebSiteSchema } from '@/lib/seo/schemas'
import { BUSINESS, KEYWORD_CLUSTERS } from '@/lib/seo/site'
import { getSiteUrl } from '@/lib/supabase/env'

export const metadata = buildPageMetadata({
  title: 'Autocast — Автоелектроніка та послуги в Житомирі',
  description: BUSINESS.description,
  path: '/',
  keywords: [...KEYWORD_CLUSTERS.localServices, ...KEYWORD_CLUSTERS.nationalShop],
})

export const revalidate = 120

export default function HomePage() {
  const siteUrl = getSiteUrl()

  return (
    <>
      <JsonLdGraph
        graphs={[
          buildLocalBusinessSchema(siteUrl),
          buildWebSiteSchema(siteUrl),
        ].filter(Boolean)}
      />
      <HeroSection />
      <Suspense fallback={null}>
        <HomePageDynamicSections />
      </Suspense>
    </>
  )
}
