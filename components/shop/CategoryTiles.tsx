'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buildCategoryMaps } from '@/lib/shop/category-tree'
import { getShopNavCategories, isSameCategoryNavSlug, resolveShopCategoryPage } from '@/lib/shop/category-aliases'
import {
  ALL_PRODUCTS_ICON,
  getCategoryBlurb,
  getCategoryIcon,
} from '@/lib/shop/category-meta'
import type { Category } from '@/types'

/** Hub grid: «Усі товари» + 10 categories + optional «Показати більше» → 3×4 on lg. */
const HUB_VISIBLE_ROOTS = 10

const SLIDE_EASE = [0.16, 1, 0.3, 1] as const

interface CategoryTilesProps {
  categories: Category[]
  /** `hub` = large tiles with icons; `compact` = low text-only chips */
  variant: 'hub' | 'compact'
  /** Currently selected root category slug (compact / category page). */
  activeSlug?: string | null
}

function subtitleFor(cat: Category, childrenByParentId: Map<string, Category[]>): string {
  const blurb = getCategoryBlurb(cat.slug)
  if (blurb) return blurb

  const kids = childrenByParentId.get(cat.id) ?? []
  if (kids.length > 0) {
    const names = kids.slice(0, 3).map(k => k.name_ua)
    return names.join(', ') + (kids.length > 3 ? '…' : '')
  }
  return ''
}

const tileLinkClass = cn(
  'group relative flex h-full min-h-[7.5rem] flex-col overflow-hidden rounded-md border',
  'border-border bg-bg-surface px-4 pt-4 pb-5',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
  'hover:bg-accent/60 hover:border-accent/75 hover:-translate-y-0.5 hover:shadow-sm'
)

function CategoryTileLink({
  cat,
  childrenByParentId,
}: {
  cat: Category
  childrenByParentId: Map<string, Category[]>
}) {
  const Icon = getCategoryIcon(cat.slug)
  const subtitle = subtitleFor(cat, childrenByParentId)

  return (
    <Link href={`/shop/${cat.slug}`} className={tileLinkClass}>
      <Icon
        size={22}
        strokeWidth={1.75}
        className="mb-3 text-text-muted transition-colors group-hover:text-text-primary"
        aria-hidden
      />
      <span className="text-[0.95rem] font-semibold leading-snug text-text-primary">
        {cat.name_ua}
      </span>
      {subtitle ? (
        <span className="mt-1 line-clamp-2 text-xs leading-snug text-text-muted transition-colors group-hover:text-text-secondary">
          {subtitle}
        </span>
      ) : null}
    </Link>
  )
}

function ExpandToggle({
  expanded,
  hiddenCount,
  onToggle,
  reduceMotion,
}: {
  expanded: boolean
  hiddenCount: number
  onToggle: () => void
  reduceMotion: boolean | null
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(tileLinkClass, 'w-full text-left')}
      aria-expanded={expanded}
    >
      <motion.span
        className="mb-3 inline-flex text-text-muted transition-colors group-hover:text-text-primary"
        animate={reduceMotion ? undefined : { rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.3, ease: SLIDE_EASE }}
        aria-hidden
      >
        <ChevronDown size={22} strokeWidth={1.75} />
      </motion.span>
      <span className="text-[0.95rem] font-semibold leading-snug text-text-primary">
        {expanded ? 'Згорнути' : 'Показати більше'}
      </span>
      <span className="mt-1 text-xs leading-snug text-text-muted transition-colors group-hover:text-text-secondary">
        {expanded
          ? 'Сховати додаткові категорії'
          : `Ще ${hiddenCount} ${hiddenCount === 1 ? 'категорія' : hiddenCount < 5 ? 'категорії' : 'категорій'}`}
      </span>
    </button>
  )
}

export default function CategoryTiles({
  categories,
  variant,
  activeSlug = null,
}: CategoryTilesProps) {
  const roots = useMemo(
    () =>
      getShopNavCategories(categories).filter(
        cat => resolveShopCategoryPage(cat.slug, categories) != null
      ),
    [categories]
  )
  const { childrenByParentId } = useMemo(() => buildCategoryMaps(categories), [categories])
  const [expanded, setExpanded] = useState(false)
  const reduceMotion = useReducedMotion()

  if (roots.length === 0) return null

  if (variant === 'compact') {
    return (
      <nav aria-label="Категорії магазину" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {roots.map(cat => {
            const active = !!activeSlug && isSameCategoryNavSlug(cat.slug, activeSlug)
            return (
              <li key={cat.id}>
                <Link
                  href={`/shop/${cat.slug}`}
                  className={cn(
                    'inline-flex items-center h-9 px-3.5 rounded-md border text-sm font-medium',
                    'transition-[background-color,border-color,color,box-shadow] duration-200',
                    active
                      ? 'bg-graphite text-text-inverse border-graphite shadow-sm'
                      : 'bg-bg-surface text-text-primary border-border hover:bg-accent/75 hover:border-accent/75'
                  )}
                >
                  {cat.name_ua}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  const AllIcon = ALL_PRODUCTS_ICON
  const hasMore = roots.length > HUB_VISIBLE_ROOTS
  const primaryRoots = hasMore ? roots.slice(0, HUB_VISIBLE_ROOTS) : roots
  const extraRoots = hasMore ? roots.slice(HUB_VISIBLE_ROOTS) : []
  const hiddenCount = extraRoots.length

  const itemTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: SLIDE_EASE }

  return (
    <nav aria-label="Оберіть напрямок" className="mb-8">
      <p className="text-sm font-medium text-text-secondary mb-3">Оберіть напрямок</p>

      <LayoutGroup id="hub-category-tiles">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <motion.li layout={!reduceMotion} transition={itemTransition}>
            <Link
              href="/shop"
              className={cn(
                'group relative flex h-full min-h-[7.5rem] flex-col overflow-hidden rounded-md border',
                'px-4 pt-4 pb-5 transition-[background-color,border-color,color,box-shadow,transform] duration-200',
                'bg-graphite text-text-inverse border-graphite shadow-sm',
                'hover:bg-accent/75 hover:border-accent/75 hover:text-text-primary hover:-translate-y-0.5'
              )}
            >
              <AllIcon
                size={22}
                strokeWidth={1.75}
                className="mb-3 text-text-inverse/80 transition-colors group-hover:text-text-primary"
                aria-hidden
              />
              <span className="text-[0.95rem] font-semibold leading-snug">Усі товари</span>
              <span className="mt-1 text-xs leading-snug text-text-inverse-muted transition-colors group-hover:text-text-secondary">
                Повний каталог Autocast
              </span>
              <span
                className="absolute inset-x-0 bottom-0 h-1 bg-accent transition-colors group-hover:bg-graphite"
                aria-hidden
              />
            </Link>
          </motion.li>

          {primaryRoots.map(cat => (
            <motion.li key={cat.id} layout={!reduceMotion} transition={itemTransition}>
              <CategoryTileLink cat={cat} childrenByParentId={childrenByParentId} />
            </motion.li>
          ))}

          {/* popLayout: exiting tiles leave flow immediately so «Згорнути» slides up with the grid */}
          <AnimatePresence initial={false} mode="popLayout">
            {expanded
              ? extraRoots.map((cat, index) => (
                  <motion.li
                    key={cat.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, y: -10, transition: { duration: 0.22, ease: SLIDE_EASE } }
                    }
                    transition={{
                      ...itemTransition,
                      delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.14),
                    }}
                  >
                    <CategoryTileLink cat={cat} childrenByParentId={childrenByParentId} />
                  </motion.li>
                ))
              : null}
          </AnimatePresence>

          {hasMore ? (
            <motion.li layout={!reduceMotion} transition={itemTransition}>
              <ExpandToggle
                expanded={expanded}
                hiddenCount={hiddenCount}
                onToggle={() => setExpanded(prev => !prev)}
                reduceMotion={reduceMotion}
              />
            </motion.li>
          ) : null}
        </ul>
      </LayoutGroup>
    </nav>
  )
}
