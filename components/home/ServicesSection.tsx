'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import ServiceCard from '@/components/services/ServiceCard'
import type { ServiceListItem } from '@/types'
import { linkTitleAllServices, linkTitleContactCta } from '@/lib/seo/accessibility'

interface ServicesSectionProps {
  services: ServiceListItem[]
}

export default function ServicesSection({ services }: ServicesSectionProps) {
  const homeServices = services.slice(0, 4)

  return (
    <section className="py-20 md:py-32 lg:py-40 bg-graphite-deep text-text-inverse border-y border-text-inverse-muted/25">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div className="max-w-2xl">
            <h2 className="text-headline text-text-inverse mb-3">Послуги</h2>
            <p className="text-text-inverse-muted">
              Autocast — це не лише магазин, а й майстерня. Робимо чисто, акуратно та з увагою до деталей.
            </p>
          </div>
          <Link href="/services" title={linkTitleAllServices()} className="block w-full md:w-auto md:shrink-0">
            <Button
              variant="secondary"
              className="micro-pop border-text-inverse-muted/35 bg-white/8 text-text-inverse hover:border-text-inverse-muted/50 hover:bg-white/12"
            >
              Всі послуги <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:gap-10">
          {homeServices.map((service, index) => (
            <ServiceCard
              key={service.slug}
              service={service}
              variant="dark"
              size="large"
              index={index}
              hideFocusOutline
              imageSizes="(max-width: 639px) calc(100vw - 2.5rem), min(700px, calc((100vw - 6rem) / 2))"
            />
          ))}
        </div>

        <div
          className={[
            'mt-14 md:mt-16 lg:mt-20 flex flex-col md:flex-row gap-6 md:items-center md:justify-between rounded-2xl p-8 md:p-10 lg:p-12',
            'bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.04]',
            'shadow-[0_24px_56px_-24px_rgb(255_193_7/0.22),inset_0_1px_0_0_rgba(255,255,255,0.12)]',
            'ring-1 ring-inset ring-accent/20',
          ].join(' ')}
        >
          <div className="max-w-xl">
            <p className="text-lg md:text-xl font-bold text-text-inverse mb-2">Потрібна консультація?</p>
            <p className="text-base md:text-lg text-text-inverse-muted leading-relaxed">
              Напишіть або зателефонуйте — підкажемо найкраще рішення для Вашого автомобіля.
            </p>
          </div>
          <a href="#contact" title={linkTitleContactCta()} className="block w-full md:w-auto md:shrink-0">
            <Button
              size="lg"
              className="micro-pop gap-2 px-8 transition-transform duration-500 hover:scale-105"
            >
              Звʼязатися
              <ArrowRight size={18} />
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
