import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CarSearch from '@/components/home/CarSearch'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import TrustHighlights from '@/components/home/TrustHighlights'
import HomeReviews from '@/components/home/HomeReviews'
import PageTransition from '@/components/layout/PageTransition'
import { getCarMakes, getCarModelsByMake, getCategories } from '@/lib/data/catalog-db'

export const metadata: Metadata = {
  title: 'Autocast — Преміальні автозапчастини',
  description:
    'Інтернет-магазин преміальної автоелектроніки: автозвук, навігація, відеореєстратори, LED освітлення, системи безпеки. Доставка по всій Україні.',
}

export default async function HomePage() {
  const [categories, makes, modelsByMake] = await Promise.all([
    getCategories(),
    getCarMakes(),
    getCarModelsByMake(),
  ])

  return (
    <PageTransition>
      <HeroSection />
      <CarSearch makes={makes} modelsByMake={modelsByMake} />
      <FeaturedCategories categories={categories} />
      <TrustHighlights />
      <HomeReviews />
    </PageTransition>
  )
}
