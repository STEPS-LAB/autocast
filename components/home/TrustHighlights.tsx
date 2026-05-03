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
    <section className="py-16 bg-graphite/5">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-headline text-text-primary mb-3">Наші переваги</h2>
          <p className="text-text-secondary">
            Якість, швидкість і підтримка — те, на що можна розраховувати.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {ITEMS.map(({ icon: Icon, title, text }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="rounded-md border border-graphite/15 bg-bg-surface p-5 micro-lift shadow-[0_12px_40px_-16px_rgb(30_35_41/0.2)]"
            >
              <div className="inline-flex size-10 items-center justify-center rounded border border-graphite/20 bg-graphite/10 mb-3">
                <Icon size={18} className="text-graphite" />
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
