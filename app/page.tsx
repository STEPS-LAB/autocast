import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import TrustHighlights from '@/components/home/TrustHighlights'
import HomeReviews from '@/components/home/HomeReviews'
import ServicesSection from '@/components/home/ServicesSection'
import PageTransition from '@/components/layout/PageTransition'
import { getCategories } from '@/lib/data/catalog-db'

export const metadata: Metadata = {
  title: 'Autocast — Преміальні автозапчастини',
  description:
    'Інтернет-магазин преміальної автоелектроніки: автозвук, навігація, відеореєстратори, LED освітлення, системи безпеки. Доставка по всій Україні.',
}

export const revalidate = 120

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <PageTransition>
      <HeroSection />
      <FeaturedCategories categories={categories} />
      <ServicesSection />
      <TrustHighlights />
      <HomeReviews />
    </PageTransition>
  )
}
