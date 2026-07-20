import TrustHighlights from '@/components/home/TrustHighlights'
import HomeReviews from '@/components/home/HomeReviews'
import ServicesSection from '@/components/home/ServicesSection'
import HomeProductsSection from '@/components/home/HomeProductsSection'
import CarSymptomsCluster from '@/components/home/CarSymptomsCluster'
import HomeUltimateCta from '@/components/home/HomeUltimateCta'
import { getHomeProducts } from '@/lib/data/home-products'
import { getServicesForListing } from '@/lib/data/services-db'
import { JsonLdGraph } from '@/lib/seo/json-ld'
import { buildServiceListSchema } from '@/lib/seo/schemas'
import { getSiteUrl } from '@/lib/supabase/env'

export default async function HomePageDynamicSections() {
  const siteUrl = getSiteUrl()
  const [services, homeProducts] = await Promise.all([
    getServicesForListing(),
    getHomeProducts(),
  ])

  return (
    <>
      <JsonLdGraph graphs={[buildServiceListSchema(services, siteUrl)]} />
      <ServicesSection services={services} />
      <HomeProductsSection products={homeProducts} />
      <TrustHighlights />
      <CarSymptomsCluster />
      <HomeReviews />
      <HomeUltimateCta />
    </>
  )
}
