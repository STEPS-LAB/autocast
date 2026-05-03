'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Radio, Speaker, Lightbulb, Shield, Layers, Aperture } from 'lucide-react'
import Button from '@/components/ui/Button'

const SERVICES = [
  {
    icon: Speaker,
    title: 'Установка та заміна аудіосистем',
    text: 'Підбір, монтаж, налаштування та акуратна інтеграція в інтерʼєр.',
  },
  {
    icon: Radio,
    title: 'Установка магнітол',
    text: 'Сумісність, підключення, функціонал, керування з керма та камери.',
  },
  {
    icon: Lightbulb,
    title: 'Установка / заміна фар',
    text: 'Світло без “колхозу”: правильно, надійно, з фокусом на безпеку.',
  },
  {
    icon: Shield,
    title: 'Сигналізації: установка та демонтаж',
    text: 'Монтаж, сервіс і коректний демонтаж з перевіркою електрики.',
  },
  {
    icon: Layers,
    title: 'Шумоізоляція та віброізоляція',
    text: 'Комфорт у салоні: зменшення шуму та вібрацій на потрібних зонах.',
  },
  {
    icon: Aperture,
    title: 'Установка лінз / перелінзовка',
    text: 'Оновлення оптики для чіткої світлотіньової межі та рівного пучка.',
  },
] as const

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {SERVICES.map(({ icon: Icon, title, text }, index) => (
            <motion.article
              key={title}
              className="h-full"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              {/*
                Hover transform/shadow live on an inner div so they do not fight Framer Motion’s
                inline transform on the motion.article (that conflict caused jerky hovers).
              */}
              <div
                className={[
                  'service-card-lift group relative h-full rounded-xl p-6 backface-hidden',
                  'bg-gradient-to-br from-white/[0.16] via-white/[0.09] to-white/[0.05]',
                  'ring-1 ring-inset ring-white/[0.07]',
                ].join(' ')}
              >
                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-accent/14 mb-4 transition-colors duration-1000 ease-out group-hover:bg-accent/20 motion-reduce:transition-none">
                  <Icon size={18} className="text-accent" />
                </div>
                <h3 className="text-base font-semibold text-text-inverse mb-1">{title}</h3>
                <p className="text-sm text-text-inverse-muted leading-relaxed">{text}</p>
              </div>
            </motion.article>
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

