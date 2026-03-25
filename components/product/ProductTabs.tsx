'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ProductTabKey = 'specs' | 'description' | 'reviews' | 'videos'

interface TabDef {
  key: ProductTabKey
  label: string
  count?: number
}

interface ProductTabsProps {
  description: React.ReactNode
  specs: React.ReactNode
  reviews: React.ReactNode
  videos: React.ReactNode
  reviewsCount?: number
  videosCount?: number
  defaultTab?: ProductTabKey
}

export default function ProductTabs({
  description,
  specs,
  reviews,
  videos,
  reviewsCount = 0,
  videosCount = 0,
  defaultTab = 'specs',
}: ProductTabsProps) {
  const tabs = useMemo<TabDef[]>(
    () => {
      const base: TabDef[] = [
        { key: 'specs', label: 'Характеристики' },
        { key: 'description', label: 'Опис' },
        { key: 'reviews', label: 'Відгуки та запитання', count: reviewsCount },
      ]
      if (videosCount > 0) {
        base.push({ key: 'videos', label: 'Відео огляди', count: videosCount })
      }
      return base
    },
    [reviewsCount, videosCount]
  )

  const [active, setActive] = useState<ProductTabKey>(defaultTab)

  useEffect(() => {
    if (videosCount > 0) return
    if (active === 'videos') setActive('specs')
  }, [active, videosCount])

  const content = useMemo(() => {
    switch (active) {
      case 'specs': return specs
      case 'description': return description
      case 'reviews': return reviews
      case 'videos': return videos
    }
  }, [active, description, reviews, specs, videos])

  return (
    <section className="mt-10">
      <div className="border-b border-border/80">
        <div className="flex flex-wrap gap-x-6 gap-y-2 overflow-visible">
          {tabs.map(t => {
            const isActive = t.key === active
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={cn(
                  'relative py-4 text-sm font-semibold whitespace-nowrap',
                  isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {t.label}
                  {typeof t.count === 'number' && t.count > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#F5C84C] text-black text-xs font-bold inline-flex items-center justify-center">
                      {t.count}
                    </span>
                  )}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="pdp-tabs-underline"
                    className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

