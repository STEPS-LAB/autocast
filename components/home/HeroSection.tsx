'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Shield, Zap, Award } from 'lucide-react'
import Button from '@/components/ui/Button'
import SmartSearchBar from '@/components/search/SmartSearchBar'

const STATS = [
  { label: 'Товарів в каталозі', value: '500+' },
  { label: 'Задоволених клієнтів', value: '12K+' },
  { label: 'Брендів-партнерів', value: '50+' },
]

const BADGES = [
  { icon: Shield, label: 'Гарантія якості' },
  { icon: Zap, label: 'Швидка доставка' },
  { icon: Award, label: 'Офіційні бренди' },
]

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
      className="relative min-h-[88vh] flex items-center overflow-hidden noise-overlay"
    >
      {/* Gradient background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-surface to-bg-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(220,38,38,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
        {/* Geometric grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </motion.div>

      <div className="container-xl relative z-10 py-24">
        <motion.div
          style={{ y: textY }}
          className="max-w-3xl"
        >
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-accent/30 bg-accent/5 mb-8"
          >
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-accent uppercase tracking-wider">
              Преміальний автомагазин
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-display text-text-primary mb-6"
          >
            Точність.{' '}
            <span className="text-accent">Надійність.</span>
            <br />
            Контроль.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-text-secondary leading-relaxed mb-10 max-w-xl"
          >
            Преміальні автозапчастини та електроніка для тих,
            хто обирає якість. Від автозвуку до систем захисту —
            все для вашого авто.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                Перейти в каталог
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/shop?q=">
              <Button size="lg" variant="secondary">
                Знайти деталь
              </Button>
            </Link>
          </motion.div>

          {/* Smart search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-md"
          >
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Швидкий пошук
            </p>
            <SmartSearchBar />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border"
          >
            {STATS.map(({ label, value }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating badges */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3"
        >
          {BADGES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass flex items-center gap-2.5 px-4 py-2.5 rounded border border-border/50"
            >
              <Icon size={16} className="text-accent shrink-0" />
              <span className="text-sm text-text-secondary whitespace-nowrap">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
