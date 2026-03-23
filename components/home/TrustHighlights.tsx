'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, ShieldCheck, Truck } from 'lucide-react'

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Найкраща якість',
    text: 'Лише перевірені товари з гарантією та офіційним походженням.',
  },
  {
    icon: Truck,
    title: 'Швидка доставка',
    text: 'Відправка в день замовлення та зручні служби доставки по Україні.',
  },
  {
    icon: BadgeCheck,
    title: 'Гарантія',
    text: 'Надаємо гарантію на товари та допомагаємо з обміном або сервісом за потреби.',
  },
]

export default function TrustHighlights() {
  return (
    <section className="py-16">
      <div className="container-xl">
        <div className="grid md:grid-cols-3 gap-4">
          {ITEMS.map(({ icon: Icon, title, text }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="rounded-md border border-border bg-bg-surface p-5 micro-lift"
            >
              <div className="inline-flex size-10 items-center justify-center rounded border border-accent/30 bg-accent/10 mb-3">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
