'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Brand, Category } from '@/types'

interface FiltersState {
  categories: string[]
  brands: string[]
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
  const [minInput, setMinInput] = useState<string>('')
  const [maxInput, setMaxInput] = useState<string>('')

  const createURL = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete('page')
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname, searchParams],
  )

  function pushURL(mutate: (params: URLSearchParams) => void) {
    router.push(createURL(mutate))
  }

  function clearFiltersOnly() {
    pushURL((params) => {
      params.delete('category')
      params.delete('brand')
      params.delete('minPrice')
      params.delete('maxPrice')
      params.delete('inStock')
    })
  }

  const hasFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    !!filters.inStock

  useEffect(() => {
    setMinInput(filters.minPrice === undefined ? '' : String(filters.minPrice))
    setMaxInput(filters.maxPrice === undefined ? '' : String(filters.maxPrice))
  }, [filters.minPrice, filters.maxPrice])

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
    const selected = filters.categories[0]
    if (!selected) return null
    const parent = parentSlugBySlug.get(selected)
    return parent ?? selected
  }, [filters.categories, parentSlugBySlug])

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

  const categoryNameBySlug = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories) map.set(c.slug, c.name_ua)
    return map
  }, [categories])

  const childrenSlugsBySlug = useMemo(() => {
    const byId = new Map(categories.map(c => [c.id, c]))
    const bySlug = new Map(categories.map(c => [c.slug, c]))
    const out = new Map<string, string[]>()
    for (const c of categories) {
      if (!c.parent_id) continue
      const p = byId.get(c.parent_id)
      if (!p) continue
      const list = out.get(p.slug) ?? []
      list.push(c.slug)
      out.set(p.slug, list)
    }
    for (const [slug, kids] of out.entries()) {
      kids.sort((a, b) => (bySlug.get(a)?.sort_order ?? 0) - (bySlug.get(b)?.sort_order ?? 0))
      out.set(slug, kids)
    }
    return out
  }, [categories])

  const ancestorSlugsBySlug = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of categories) {
      const chain: string[] = []
      let cur: string | undefined = c.slug
      while (cur) {
        const parent = parentSlugBySlug.get(cur)
        if (!parent) break
        chain.push(parent)
        cur = parent
      }
      map.set(c.slug, chain)
    }
    return map
  }, [categories, parentSlugBySlug])

  function setCategories(next: string[]) {
    const unique = Array.from(new Set(next.map(s => s.trim()).filter(Boolean)))
    pushURL((params) => {
      params.delete('category')
      for (const slug of unique) params.append('category', slug)
    })
  }

  function toggleCategory(slug: string, includeDescendants: boolean) {
    const set = new Set(filters.categories)
    // URL stores only explicitly selected slugs.
    // Filtering expands descendants in `ShopContent`, so we must NOT add all descendants here.
    if (set.has(slug)) {
      set.delete(slug)
      setCategories(Array.from(set))
      return
    }

    // Selecting a subcategory should not be broadened by an already-selected ancestor.
    if (!includeDescendants) {
      const ancestors = ancestorSlugsBySlug.get(slug) ?? []
      for (const a of ancestors) set.delete(a)
    } else {
      // Selecting a parent should replace any explicitly selected descendants to avoid confusion.
      // (Filtering will include them anyway via descendants expansion.)
      const directKids = childrenSlugsBySlug.get(slug) ?? []
      for (const kid of directKids) set.delete(kid)
    }

    set.add(slug)
    setCategories(Array.from(set))
  }

  function setBrands(next: string[]) {
    const unique = Array.from(new Set(next.map(s => s.trim()).filter(Boolean)))
    pushURL((params) => {
      params.delete('brand')
      for (const b of unique) params.append('brand', b)
    })
  }

  function toggleBrand(name: string) {
    const set = new Set(filters.brands)
    if (set.has(name)) set.delete(name)
    else set.add(name)
    setBrands(Array.from(set))
  }

  function setPriceRange(min: number | undefined, max: number | undefined) {
    pushURL((params) => {
      if (min === undefined) params.delete('minPrice')
      else params.set('minPrice', String(min))
      if (max === undefined) params.delete('maxPrice')
      else params.set('maxPrice', String(max))
    })
  }

  function applyPrice() {
    const min = minInput.trim() === '' ? undefined : Number(minInput)
    const max = maxInput.trim() === '' ? undefined : Number(maxInput)
    const minOk = min === undefined || Number.isFinite(min)
    const maxOk = max === undefined || Number.isFinite(max)
    if (!minOk || !maxOk) return
    if (min !== undefined && max !== undefined && min > max) {
      setPriceRange(max, min)
      return
    }
    setPriceRange(min, max)
  }

  function toggleInStock(next: boolean) {
    pushURL((params) => {
      if (next) params.set('inStock', '1')
      else params.delete('inStock')
    })
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    for (const slug of filters.categories) {
      const name = categoryNameBySlug.get(slug) ?? slug
      chips.push({
        key: `cat:${slug}`,
        label: name,
        onRemove: () => setCategories(filters.categories.filter(s => s !== slug)),
      })
    }
    for (const b of filters.brands) {
      chips.push({
        key: `brand:${b}`,
        label: b,
        onRemove: () => setBrands(filters.brands.filter(x => x !== b)),
      })
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const label =
        filters.minPrice !== undefined && filters.maxPrice !== undefined
          ? `${filters.minPrice.toLocaleString('uk-UA')}–${filters.maxPrice.toLocaleString('uk-UA')}₴`
          : filters.minPrice !== undefined
          ? `від ${filters.minPrice.toLocaleString('uk-UA')}₴`
          : `до ${filters.maxPrice?.toLocaleString('uk-UA')}₴`
      chips.push({
        key: 'price',
        label,
        onRemove: () => setPriceRange(undefined, undefined),
      })
    }
    if (filters.inStock) {
      chips.push({
        key: 'stock',
        label: 'В наявності',
        onRemove: () => toggleInStock(false),
      })
    }
    return chips
  }, [
    filters.categories,
    filters.brands,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    categoryNameBySlug,
  ])

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
              onClick={clearFiltersOnly}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Очистити
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-[10px] text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Активні
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeChips.map(chip => (
              <button
                key={chip.key}
                onClick={chip.onRemove}
                className={cn(
                  'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full',
                  'border border-border bg-bg-surface text-xs text-text-secondary',
                  'hover:text-text-primary hover:border-border-light hover:bg-bg-elevated transition-colors'
                )}
              >
                <span className="truncate max-w-[12rem]">{chip.label}</span>
                <X size={12} className="opacity-70" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Категорія
        </h4>
        <ul className="flex flex-col gap-1">
          <li>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.length === 0}
                onChange={(e) => {
                  if (e.target.checked) setCategories([])
                }}
                className="size-4 accent-accent rounded"
              />
              <span className="text-sm text-text-secondary">Всі категорії</span>
            </label>
          </li>
          {topLevel.map(cat => {
            const kids = childrenByParentSlug.get(cat.slug) ?? []
            const hasKids = kids.length > 0
            const expandedNow = hasKids && isExpanded(cat.slug)
            const isActiveParent = activeTopSlug === cat.slug
            const parentChecked = filters.categories.includes(cat.slug)
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasKids) toggleExpand(cat.slug)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 text-left text-sm px-2 py-1.5 rounded-[10px] transition-colors',
                    isActiveParent
                      ? 'text-black bg-accent/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  )}
                  aria-expanded={hasKids ? expandedNow : undefined}
                >
                  <span className="min-w-0 truncate flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={parentChecked}
                      onChange={() => toggleCategory(cat.slug, true)}
                      className="size-4 accent-accent rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="truncate">{cat.name_ua}</span>
                  </span>
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
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(kid.slug)}
                              onChange={() => toggleCategory(kid.slug, false)}
                              className="size-4 accent-accent rounded"
                            />
                            <span className="text-sm text-text-secondary">{kid.name_ua}</span>
                          </label>
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
        <form
          onSubmit={(e) => {
            e.preventDefault()
            applyPrice()
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              inputMode="numeric"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Мін, ₴"
              className={cn(
                'no-focus-outline h-9 bg-bg-surface border border-border rounded-[10px] px-3 text-sm text-text-primary placeholder:text-text-muted',
                'focus:border-accent'
              )}
            />
            <input
              inputMode="numeric"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Макс, ₴"
              className={cn(
                'no-focus-outline h-9 bg-bg-surface border border-border rounded-[10px] px-3 text-sm text-text-primary placeholder:text-text-muted',
                'focus:border-accent'
              )}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 rounded-[10px]" onClick={applyPrice} type="button">
              Застосувати
            </Button>
            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <Button
                size="sm"
                variant="secondary"
                className="px-3"
                type="button"
                onClick={() => setPriceRange(undefined, undefined)}
              >
                Скинути
              </Button>
            )}
          </div>
        </form>
        <div className="mt-4">
          <p className="text-[11px] text-text-muted mb-2">Швидкі діапазони</p>
          <ul className="flex flex-col gap-1">
            {PRICE_RANGES.map(range => (
              <li key={range.label}>
                <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                    onChange={() => setPriceRange(range.min, range.max)}
                    className="size-4 accent-accent rounded"
                  />
                  <span className="text-sm text-text-secondary">{range.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Бренд
        </h4>
        <ul className="flex flex-col gap-1">
          <li>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={filters.brands.length === 0}
                onChange={(e) => {
                  if (e.target.checked) setBrands([])
                }}
                className="size-4 accent-accent rounded"
              />
              <span className="text-sm text-text-secondary">Всі бренди</span>
            </label>
          </li>
          {brands.slice(0, 4).map(brand => (
            <li key={brand.id}>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand.name)}
                  onChange={() => toggleBrand(brand.name)}
                  className="size-4 accent-accent rounded"
                />
                <span className="text-sm text-text-secondary">{brand.name}</span>
              </label>
            </li>
          ))}

          {brands.length > 4 && (
            <li className="mt-1">
              <button
                type="button"
                onClick={() => setBrandsExpanded(v => !v)}
                className={cn(
                  'w-full flex items-center justify-between text-left text-sm px-2 py-1.5 rounded-[10px] transition-colors',
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
                        <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand.name)}
                            onChange={() => toggleBrand(brand.name)}
                            className="size-4 accent-accent rounded"
                          />
                          <span className="text-sm text-text-secondary">{brand.name}</span>
                        </label>
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
            onChange={e => toggleInStock(e.target.checked)}
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
          onClick={clearFiltersOnly}
          className="mt-6 border border-border"
        >
          <X size={14} />
          Скинути фільтри
        </Button>
      )}
    </aside>
  )
}
