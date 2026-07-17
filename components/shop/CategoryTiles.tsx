'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buildCategoryMaps } from '@/lib/shop/category-tree'
import {
  ALL_PRODUCTS_ICON,
  getCategoryBlurb,
  getCategoryIcon,
} from '@/lib/shop/category-meta'
import type { Category } from '@/types'

interface CategoryTilesProps {
  categories: Category[]
  /** `hub` = large tiles with icons; `compact` = low text-only chips */
  variant: 'hub' | 'compact'
  /** Currently selected root category slug (compact / category page). */
  activeSlug?: string | null
}

function subtitleFor(cat: Category, childrenByParentId: Map<string, Category[]>): string {
  const kids = childrenByParentId.get(cat.id) ?? []
  if (kids.length > 0) {
    const names = kids.slice(0, 3).map(k => k.name_ua)
    return names.join(', ') + (kids.length > 3 ? '…' : '')
  }
  return getCategoryBlurb(cat.slug)
}

export default function CategoryTiles({
  categories,
  variant,
  activeSlug = null,
}: CategoryTilesProps) {
  const { childrenByParentId } = useMemo(() => buildCategoryMaps(categories), [categories])

  if (categories.length === 0) return null

  if (variant === 'compact') {
    return (
      <nav aria-label="Категорії магазину" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const active = cat.slug === activeSlug
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

  return (
    <nav aria-label="Оберіть напрямок" className="mb-8">
      <p className="text-sm font-medium text-text-secondary mb-3">Оберіть напрямок</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <li>
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
        </li>

        {categories.map(cat => {
          const Icon = getCategoryIcon(cat.slug)
          const subtitle = subtitleFor(cat, childrenByParentId)

          return (
            <li key={cat.id}>
              <Link
                href={`/shop/${cat.slug}`}
                className={cn(
                  'group relative flex h-full min-h-[7.5rem] flex-col overflow-hidden rounded-md border',
                  'border-border bg-bg-surface px-4 pt-4 pb-5',
                  'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
                  'hover:bg-accent/60 hover:border-accent/75 hover:-translate-y-0.5 hover:shadow-sm'
                )}
              >
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
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
