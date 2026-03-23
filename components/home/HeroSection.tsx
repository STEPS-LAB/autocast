'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import SmartSearchBar from '@/components/search/SmartSearchBar'

const STATS = [
  { label: 'Товарів в каталозі', value: '500+' },
  { label: 'Задоволених клієнтів', value: '12K+' },
  { label: 'Брендів-партнерів', value: '50+' },
]

const HERO_SLIDE = {
  id: 'new',
  eyebrow: 'Гарантія якості',
  title: 'Автозвук, світло, електроніка.',
  description:
    'Все для тюнінгу, комфорту та безпеки вашого авто — від автозвуку до охоронних систем.',
  cta: 'Переглянути каталог',
  href: '/shop',
  image:
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1800&auto=format&fit=crop&q=80',
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])

  return (
    <section
      ref={ref}
      className="relative -mt-[70px] pt-[70px] min-h-screen flex items-center overflow-hidden noise-overlay"
    >
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute inset-0">
          <Image
            src={HERO_SLIDE.image}
            alt={HERO_SLIDE.title}
            fill
            preload
            sizes="100vw"
            quality={75}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/70 to-bg-primary/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_45%_at_30%_40%,rgba(220,38,38,0.25),transparent)]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
      </motion.div>

      <div className="container-xl relative z-10 py-24">
        <motion.div
          style={{ y: textY }}
          className="relative w-full"
        >
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-accent/30 bg-accent/5 mb-8"
            >
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent uppercase tracking-wider">
                {HERO_SLIDE.eyebrow}
              </span>
            </motion.div>

            <motion.h1
              key={HERO_SLIDE.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-display text-text-primary mb-6"
            >
              <span className="text-accent">Автозвук</span>, світло, електроніка.
            </motion.h1>

            <motion.p
              key={`${HERO_SLIDE.id}-desc`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-lg text-text-secondary leading-relaxed mb-10 max-w-xl"
            >
              {HERO_SLIDE.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Link href={HERO_SLIDE.href}>
                <Button size="lg" className="gap-2 micro-pop">
                  {HERO_SLIDE.cta}
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/#car-search" className="lg:min-w-[11.7rem]">
                <Button size="lg" variant="secondary" fullWidth className="micro-pop">
                  Знайти деталь
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-md w-full rounded-lg border border-accent/35 bg-bg-surface/88 backdrop-blur-md px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.25)]"
            >
              <p className="text-[11px] text-accent uppercase tracking-[0.2em] mb-2 font-semibold">
                Швидкий пошук
              </p>
              <SmartSearchBar className="drop-shadow-sm" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap lg:flex-nowrap gap-6 lg:gap-10 lg:justify-end lg:ml-auto lg:text-right"
            >
              {STATS.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-impact text-text-primary">{value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

        </motion.div>

      </div>
    </section>
  )
}
