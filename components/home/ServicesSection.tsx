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
    <section className="py-20 bg-bg-surface border-y border-border">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10"
        >
          <div className="max-w-2xl">
            <h2 className="text-headline text-text-primary mb-3">Послуги</h2>
            <p className="text-text-secondary">
              Autocast — це не лише магазин, а й майстерня. Робимо чисто, акуратно та з увагою до деталей.
            </p>
          </div>
          <Link href="/services" className="shrink-0">
            <Button variant="secondary" className="micro-pop">
              Всі послуги <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {SERVICES.map(({ icon: Icon, title, text }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-md border border-border bg-bg-elevated p-5 micro-lift"
            >
              <div className="inline-flex size-10 items-center justify-center rounded border border-accent/30 bg-accent/10 mb-3">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-md border border-border bg-bg-elevated p-5">
          <div>
            <p className="text-sm font-semibold text-text-primary">Потрібна консультація?</p>
            <p className="text-sm text-text-secondary">Напишіть або зателефонуйте — підкажемо найкраще рішення.</p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button className="micro-pop">Звʼязатися</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

