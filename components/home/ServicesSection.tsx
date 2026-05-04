'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import ServiceCard from '@/components/services/ServiceCard'
import { SERVICES } from '@/lib/data/services'

const HOME_SERVICES = SERVICES.slice(0, 4)

export default function ServicesSection() {
  return (
    <section className="py-20 bg-graphite-deep text-text-inverse border-y border-text-inverse-muted/25">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10"
        >
          <div className="max-w-2xl">
            <h2 className="text-headline text-text-inverse mb-3">Послуги</h2>
            <p className="text-text-inverse-muted">
              Autocast — це не лише магазин, а й майстерня. Робимо чисто, акуратно та з увагою до деталей.
            </p>
          </div>
          <Link href="/services" className="shrink-0">
            <Button
              variant="secondary"
              className="micro-pop border-text-inverse-muted/35 bg-white/8 text-text-inverse hover:border-text-inverse-muted/50 hover:bg-white/12"
            >
              Всі послуги <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-8">
          {HOME_SERVICES.map((service, index) => (
            <ServiceCard
              key={service.slug}
              slug={service.slug}
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
            'mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-xl p-6',
            'bg-gradient-to-br from-white/[0.12] via-white/[0.07] to-white/[0.04]',
            'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
            'ring-1 ring-inset ring-white/[0.07]',
          ].join(' ')}
        >
          <div>
            <p className="text-sm font-semibold text-text-inverse">Потрібна консультація?</p>
            <p className="text-sm text-text-inverse-muted">Напишіть або зателефонуйте — підкажемо найкраще рішення.</p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button className="micro-pop">Звʼязатися</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
