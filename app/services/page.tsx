import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'
import Button from '@/components/ui/Button'
import ServiceCard from '@/components/services/ServiceCard'
import { CornerAccentLines } from '@/components/services/ServiceSectionDecor'
import { SERVICES } from '@/lib/data/services'

export const metadata: Metadata = {
  title: 'Послуги',
  description:
    'Майстерня Autocast: установка автозвуку, магнітол, фар, сигналізацій, шумоізоляція та перелінзовка. Професійний монтаж і консультація.',
}

export default function ServicesPage() {
  return (
    <PageTransition>
      <section className="relative overflow-hidden pt-20 pb-14 md:pt-24 md:pb-16">
        <div className="pointer-events-none absolute right-4 top-28 text-accent/20 md:right-12">
          <CornerAccentLines className="h-20 w-20 md:h-28 md:w-28" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        <div className="container-xl relative">
          <div className="max-w-3xl">
            <h1 className="text-headline text-text-primary mb-4">Послуги</h1>
            <p className="text-lg leading-relaxed text-text-secondary">
              Autocast — майстерня з акуратним монтажем і повагою до електрики вашого авто. Обирайте напрямок нижче —
              підкажемо оптимальний варіант і зробимо роботу якісно.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {SERVICES.map((service, index) => (
              <ServiceCard
                key={service.slug}
                slug={service.slug}
                variant="light"
                index={index}
                hideIconBadgeBorder
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative pb-20 pt-6 md:pb-24">
        <div className="container-xl">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-bg-surface/85 p-8 shadow-[0_24px_56px_-24px_rgb(15_23_42/0.18)] backdrop-blur-md md:p-10">
            <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-accent/[0.07] blur-3xl" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-headline text-text-primary mb-2">Хочете підібрати рішення під ваше авто?</h2>
                <p className="text-lg leading-relaxed text-text-secondary">
                  Напишіть нам — підкажемо комплектацію, терміни та варіанти.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact">
                  <Button className="micro-pop">Звʼязатися</Button>
                </Link>
                <Link href="/shop">
                  <Button variant="secondary" className="micro-pop">
                    Перейти в магазин <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
