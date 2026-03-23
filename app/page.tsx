import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CarSearch from '@/components/home/CarSearch'
import FeaturedCategories from '@/components/home/FeaturedCategories'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import VINSearch from '@/components/vin/VINSearch'
import PageTransition from '@/components/layout/PageTransition'

export const metadata: Metadata = {
  title: 'Autocast — Преміальні автозапчастини',
  description:
    'Інтернет-магазин преміальної автоелектроніки: автозвук, навігація, відеореєстратори, LED освітлення, системи безпеки. Доставка по всій Україні.',
}

export default function HomePage() {
  return (
    <PageTransition>
      <HeroSection />
      <CarSearch />
      <FeaturedCategories />
      <FeaturedProducts />
      <VINSearch />
    </PageTransition>
  )
}
