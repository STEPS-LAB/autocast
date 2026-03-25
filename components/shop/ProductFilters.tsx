'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
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

  function toggleExpand(slug: string) {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }))
  }

  function isExpanded(slug: string) {
    return expanded[slug] || activeTopSlug === slug
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
                <div className="flex items-center gap-1">
                  {hasKids ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.slug)}
                      className="size-7 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center justify-center"
                      aria-label={expandedNow ? 'Згорнути підкатегорії' : 'Розгорнути підкатегорії'}
                      title={expandedNow ? 'Згорнути' : 'Розгорнути'}
                    >
                      {expandedNow ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <span className="size-7 shrink-0" />
                  )}
                  <button
                    onClick={() => {
                      setFilter('category', cat.slug)
                      if (hasKids) setExpanded(prev => ({ ...prev, [cat.slug]: true }))
                    }}
                    className={cn(
                      'flex-1 text-left text-sm px-2 py-1.5 rounded transition-colors',
                      isActiveParent
                        ? 'text-black bg-accent/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    )}
                  >
                    {cat.name_ua}
                  </button>
                </div>

                {expandedNow && (
                  <ul className="mt-1 ml-7 flex flex-col gap-1">
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
                  </ul>
                )}
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
          {brands.map(brand => (
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
