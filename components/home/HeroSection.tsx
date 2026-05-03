'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
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
    '/images/hero.webp',
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const [isCoarseOrSmall, setIsCoarseOrSmall] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse), (max-width: 1024px)')
    const update = () => setIsCoarseOrSmall(mql.matches)
    update()
    // Safari < 14 uses addListener/removeListener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    }
    const legacyMql = mql as MediaQueryList & {
      addListener?: (listener: () => void) => void
      removeListener?: (listener: () => void) => void
    }
    legacyMql.addListener?.(update)
    return () => legacyMql.removeListener?.(update)
  }, [])

  const disableScrollEffects = useMemo(
    () => reduceMotion || isCoarseOrSmall,
    [reduceMotion, isCoarseOrSmall],
  )

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])

  /**
   * Full-bleed overlays (not parallax): layered radials so the photo “opens” toward center-right
   * instead of a flat plate — still graphite-only, no light band at the bottom.
   */
  const heroOverlayBg = [
    'radial-gradient(ellipse 70% 54% at 34% 36%, rgb(255 193 7 / 0.11), transparent 54%)',
    'radial-gradient(ellipse 118% 108% at 6% 52%, rgb(30 35 41 / 0.6) 0%, rgb(30 35 41 / 0.32) 40%, rgb(30 35 41 / 0.08) 56%, transparent 72%)',
    'radial-gradient(ellipse 95% 100% at 96% 28%, rgb(30 35 41 / 0.26) 0%, rgb(30 35 41 / 0.06) 45%, transparent 62%)',
    'linear-gradient(to bottom, rgb(30 35 41 / 0.12) 0%, transparent 22%, transparent 78%, rgb(30 35 41 / 0.14) 100%)',
  ].join(',')

  return (
    <section
      ref={ref}
      className={[
        'relative -mt-[70px] pt-[70px] min-h-screen flex items-center overflow-hidden',
        disableScrollEffects ? '' : 'noise-overlay',
      ].join(' ')}
    >
      {/* Parallax: only the photo — taller layer avoids empty strips when `y` shifts */}
      <motion.div
        style={{ y: disableScrollEffects ? 0 : bgY, willChange: 'transform' }}
        className="absolute inset-0 -z-20 overflow-hidden pointer-events-none"
      >
        <div className="absolute left-0 right-0 top-[-12%] h-[124%] w-full">
          <Image
            src={HERO_SLIDE.image}
            alt={HERO_SLIDE.title}
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover"
          />
        </div>
      </motion.div>

      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden
        style={{ backgroundImage: heroOverlayBg }}
      />

      <div className="container-xl relative z-10 py-24">
        <motion.div
          style={{ y: disableScrollEffects ? 0 : textY, willChange: 'transform' }}
          className="relative w-full"
        >
          <div className="max-w-3xl">
            <motion.h1
              key={HERO_SLIDE.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-display text-text-inverse mb-6"
            >
              <span className="text-accent">Автозвук</span>, світло, електроніка.
            </motion.h1>

            <motion.p
              key={`${HERO_SLIDE.id}-desc`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-lg text-white/88 leading-relaxed mb-10 max-w-xl"
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
              <Link href="/shop" className="lg:min-w-[11.7rem]">
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
              className={[
                'max-w-md w-full rounded-lg border border-accent/35 bg-bg-surface/88 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.25)]',
                disableScrollEffects ? '' : 'backdrop-blur-md',
              ].join(' ')}
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
              className="grid grid-cols-3 gap-4 lg:flex lg:flex-nowrap lg:gap-10 lg:justify-end lg:ml-auto lg:text-right"
            >
              {STATS.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-impact text-text-inverse">{value}</p>
                  <p className="text-[11px] leading-tight text-text-inverse-muted mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

        </motion.div>

      </div>
    </section>
  )
}
