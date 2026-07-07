import HeroSection from '@/components/home/HeroSection'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import TrustHighlights from '@/components/home/TrustHighlights'
import HomeReviews from '@/components/home/HomeReviews'
import ServicesSection from '@/components/home/ServicesSection'
import CarSymptomsCluster from '@/components/home/CarSymptomsCluster'
import HomeUltimateCta from '@/components/home/HomeUltimateCta'
import PageTransition from '@/components/layout/PageTransition'
import { getCategories } from '@/lib/data/catalog-db'
import { getServicesForListing } from '@/lib/data/services-db'
import { JsonLdGraph } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { buildLocalBusinessSchema, buildServiceListSchema, buildWebSiteSchema } from '@/lib/seo/schemas'
import { BUSINESS, KEYWORD_CLUSTERS } from '@/lib/seo/site'
import { getSiteUrl } from '@/lib/supabase/env'

export const metadata = buildPageMetadata({
  title: 'Autocast — Автоелектроніка та послуги в Житомирі',
  description: BUSINESS.description,
  path: '/',
  keywords: [...KEYWORD_CLUSTERS.localServices, ...KEYWORD_CLUSTERS.nationalShop],
})

export const revalidate = 120

export default async function HomePage() {
  const siteUrl = getSiteUrl()
  const [categories, services] = await Promise.all([
    getCategories(),
    getServicesForListing(),
  ])

  return (
    <PageTransition>
      <JsonLdGraph
        graphs={[
          buildLocalBusinessSchema(siteUrl),
          buildWebSiteSchema(siteUrl),
          buildServiceListSchema(services, siteUrl),
        ].filter(Boolean)}
      />
      <HeroSection />
      <FeaturedCategories categories={categories} />
      <ServicesSection services={services} />
      <TrustHighlights />
      <CarSymptomsCluster />
      <HomeReviews />
      <HomeUltimateCta />
    </PageTransition>
  )
}
