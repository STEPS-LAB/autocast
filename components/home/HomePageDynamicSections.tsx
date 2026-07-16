import TrustHighlights from '@/components/home/TrustHighlights'
import HomeReviews from '@/components/home/HomeReviews'
import ServicesSection from '@/components/home/ServicesSection'
import CarSymptomsCluster from '@/components/home/CarSymptomsCluster'
import HomeUltimateCta from '@/components/home/HomeUltimateCta'
import { getServicesForListing } from '@/lib/data/services-db'
import { JsonLdGraph } from '@/lib/seo/json-ld'
import { buildServiceListSchema } from '@/lib/seo/schemas'
import { getSiteUrl } from '@/lib/supabase/env'

export default async function HomePageDynamicSections() {
  const siteUrl = getSiteUrl()
  const services = await getServicesForListing()

  return (
    <>
      <JsonLdGraph graphs={[buildServiceListSchema(services, siteUrl)]} />
      <ServicesSection services={services} />
      <TrustHighlights />
      <CarSymptomsCluster />
      <HomeReviews />
      <HomeUltimateCta />
    </>
  )
}
