'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Brand, Category } from '@/types'

interface FiltersState {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

interface ProductFiltersProps {
  filters: FiltersState
  onClose?: () => void
  categories: Category[]
  brands: Brand[]
}

const PRICE_RANGES = [
  { label: 'До 1 000₴', min: 0, max: 1000 },
  { label: '1 000 – 5 000₴', min: 1000, max: 5000 },
  { label: '5 000 – 10 000₴', min: 5000, max: 10000 },
  { label: 'Понад 10 000₴', min: 10000, max: 999999 },
]

export default function ProductFilters({ filters, onClose, categories, brands }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [brandsExpanded, setBrandsExpanded] = useState(false)

  const createURL = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === '') {
          params.delete(key)
        } else {
          params.set(key, val)
        }
      })
      params.delete('page')
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  function setFilter(key: string, value: string | null) {
    router.push(createURL({ [key]: value }))
  }

  function clearAll() {
    router.push(pathname)
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const { topLevel, childrenByParentSlug, parentSlugBySlug } = useMemo(() => {
    const byParentId = new Map<string, Category[]>()
    const byId = new Map(categories.map(c => [c.id, c]))
    const parentSlugBySlug = new Map<string, string>()
    for (const c of categories) {
      if (!c.parent_id) continue
      const p = byId.get(c.parent_id)
      if (p) parentSlugBySlug.set(c.slug, p.slug)
      const list = byParentId.get(c.parent_id) ?? []
      list.push(c)
      byParentId.set(c.parent_id, list)
    }
    for (const list of byParentId.values()) {
      list.sort((a, b) => (a.sort_order - b.sort_order) || a.name_ua.localeCompare(b.name_ua))
    }

    const childrenByParentSlug = new Map<string, Category[]>()
    for (const [parentId, kids] of byParentId.entries()) {
      const parent = byId.get(parentId)
      if (parent) childrenByParentSlug.set(parent.slug, kids)
    }
    const topLevel = categories
      .filter(c => !c.parent_id)
      .slice()
      .sort((a, b) => (a.sort_order - b.sort_order) || a.name_ua.localeCompare(b.name_ua))
    return { topLevel, childrenByParentSlug, parentSlugBySlug }
  }, [categories])

  const activeTopSlug = useMemo(() => {
    const selected = filters.category
    if (!selected) return null
    const parent = parentSlugBySlug.get(selected)
    return parent ?? selected
  }, [filters.category, parentSlugBySlug])

  useEffect(() => {
    if (!activeTopSlug) return
    setExpanded(prev => (prev[activeTopSlug] ? prev : { ...prev, [activeTopSlug]: true }))
  }, [activeTopSlug])

  function toggleExpand(slug: string) {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }))
  }

  function isExpanded(slug: string) {
    return !!expanded[slug]
  }

  return (
    <aside className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Фільтри</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Очистити
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Категорія
        </h4>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              onClick={() => setFilter('category', null)}
              className={cn(
                'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                !filters.category
                  ? 'text-black bg-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
            >
              Всі категорії
            </button>
          </li>
          {topLevel.map(cat => {
            const kids = childrenByParentSlug.get(cat.slug) ?? []
            const hasKids = kids.length > 0
            const expandedNow = hasKids && isExpanded(cat.slug)
            const isActiveParent = activeTopSlug === cat.slug
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('category', cat.slug)
                    if (hasKids) toggleExpand(cat.slug)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 text-left text-sm px-2 py-1.5 rounded transition-colors',
                    isActiveParent
                      ? 'text-black bg-accent/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  )}
                  aria-expanded={hasKids ? expandedNow : undefined}
                >
                  <span className="min-w-0 truncate">{cat.name_ua}</span>
                  {hasKids ? (
                    <motion.span
                      animate={{ rotate: expandedNow ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      className="text-text-muted shrink-0"
                    >
                      <ChevronDown size={14} />
                    </motion.span>
                  ) : (
                    <ChevronRight size={14} className="opacity-0 shrink-0" aria-hidden="true" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {expandedNow && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden mt-1 ml-4 flex flex-col gap-1"
                    >
                      {kids.map(kid => (
                        <li key={kid.id}>
                          <button
                            onClick={() => setFilter('category', kid.slug)}
                            className={cn(
                              'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                              filters.category === kid.slug
                                ? 'text-black bg-accent/20'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                            )}
                          >
                            {kid.name_ua}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Price */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Ціна
        </h4>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              onClick={() => { setFilter('minPrice', null); setFilter('maxPrice', null) }}
              className={cn(
                'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                !filters.minPrice && !filters.maxPrice
                  ? 'text-black bg-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
            >
              Будь-яка
            </button>
          </li>
          {PRICE_RANGES.map(range => (
            <li key={range.label}>
              <button
                onClick={() => {
                  setFilter('minPrice', String(range.min))
                  setFilter('maxPrice', String(range.max))
                }}
                className={cn(
                  'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                  filters.minPrice === range.min && filters.maxPrice === range.max
                    ? 'text-black bg-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                {range.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Бренд
        </h4>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              onClick={() => setFilter('brand', null)}
              className={cn(
                'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                !filters.brand
                  ? 'text-black bg-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
            >
              Всі бренди
            </button>
          </li>
          {brands.slice(0, 4).map(brand => (
            <li key={brand.id}>
              <button
                onClick={() => setFilter('brand', brand.name)}
                className={cn(
                  'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                  filters.brand === brand.name
                    ? 'text-black bg-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                {brand.name}
              </button>
            </li>
          ))}

          {brands.length > 4 && (
            <li className="mt-1">
              <button
                type="button"
                onClick={() => setBrandsExpanded(v => !v)}
                className={cn(
                  'w-full flex items-center justify-between text-left text-sm px-2 py-1.5 rounded transition-colors',
                  'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
                aria-expanded={brandsExpanded}
              >
                <span className="text-xs font-medium">
                  {brandsExpanded ? 'Згорнути' : `Показати ще (${brands.length - 4})`}
                </span>
                <motion.span
                  animate={{ rotate: brandsExpanded ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-text-muted"
                >
                  <ChevronDown size={14} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {brandsExpanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden mt-1 flex flex-col gap-1"
                  >
                    {brands.slice(4).map(brand => (
                      <li key={brand.id}>
                        <button
                          onClick={() => setFilter('brand', brand.name)}
                          className={cn(
                            'w-full text-left text-sm px-2 py-1.5 rounded transition-colors',
                            filters.brand === brand.name
                              ? 'text-black bg-accent/20'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                          )}
                        >
                          {brand.name}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>
          )}
        </ul>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={e => setFilter('inStock', e.target.checked ? '1' : null)}
            className="size-4 accent-accent rounded"
          />
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            Тільки в наявності
          </span>
        </label>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={clearAll}
          className="mt-6 border border-border"
        >
          <X size={14} />
          Скинути фільтри
        </Button>
      )}
    </aside>
  )
}
