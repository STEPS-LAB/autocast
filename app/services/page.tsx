'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Radio, Speaker, Lightbulb, Shield, Layers, Aperture, ArrowRight } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'
import Button from '@/components/ui/Button'

const SERVICES = [
  {
    icon: Speaker,
    title: 'Установка / заміна аудіосистем',
    bullets: [
      'Підбір компонентів під ваш бюджет та авто',
      'Акуратний монтаж та укладка проводки',
      'Налаштування звучання',
    ],
  },
  {
    icon: Radio,
    title: 'Установка магнітол',
    bullets: [
      'Підключення та налаштування',
      'Інтеграція керування з керма (за наявності)',
      'Підключення камери заднього виду',
    ],
  },
  {
    icon: Lightbulb,
    title: 'Установка / заміна фар',
    bullets: [
      'Підбір та заміна оптики',
      'Перевірка коректності підключення',
      'Фокус на безпеку та правильне світло',
    ],
  },
  {
    icon: Shield,
    title: 'Установка / демонтаж сигналізацій',
    bullets: [
      'Монтаж охоронних систем',
      'Сервіс та діагностика',
      'Коректний демонтаж без “сюрпризів” в електриці',
    ],
  },
  {
    icon: Layers,
    title: 'Шумоізоляція та віброізоляція',
    bullets: [
      'Підбір матеріалів під зони салону',
      'Двері / арки / підлога / багажник (за потреби)',
      'Відчутний комфорт на трасі',
    ],
  },
  {
    icon: Aperture,
    title: 'Установка лінз / перелінзовка',
    bullets: [
      'Оновлення оптики під сучасні стандарти',
      'Рівний пучок та чітка світлотіньова межа',
      'Професійний підхід до результату',
    ],
  },
] as const

export default function ServicesPage() {
  return (
    <PageTransition>
      <section className="py-16">
        <div className="container-xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl mb-10"
          >
            <h1 className="text-headline text-text-primary mb-3">Послуги</h1>
            <p className="text-text-secondary leading-relaxed">
              Autocast — майстерня з акуратним монтажем і повагою до електрики вашого авто. Підкажемо оптимальний варіант
              та зробимо роботу якісно.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {SERVICES.map(({ icon: Icon, title, bullets }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="rounded-md border border-border bg-bg-surface p-5 micro-lift"
              >
                <div className="inline-flex size-10 items-center justify-center rounded border border-accent/30 bg-accent/10 mb-3">
                  <Icon size={18} className="text-accent" />
                </div>
                <h2 className="text-base font-semibold text-text-primary mb-2">{title}</h2>
                <ul className="space-y-1.5">
                  {bullets.map(b => (
                    <li key={b} className="text-sm text-text-secondary leading-relaxed">
                      <span className="text-accent">• </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div className="max-w-2xl">
              <h2 className="text-headline text-text-primary mb-2">Хочете підібрати рішення під ваше авто?</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Напишіть нам — підкажемо комплектацію, терміни та варіанти.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/contact">
                <Button className="micro-pop">Звʼязатися</Button>
              </Link>
              <Link href="/shop">
                <Button variant="secondary" className="micro-pop">
                  Перейти в магазин <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}

