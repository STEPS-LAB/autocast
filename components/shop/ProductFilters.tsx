'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { buildCategoryMaps, getDirectChildren } from '@/lib/shop/category-tree'
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
  /** hub = /shop; category = /shop/[slug] with subcategory accordions */
  mode: 'hub' | 'category'
  rootCategory?: Category | null
}

const PRICE_RANGES = [
  { label: 'До 1 000₴', min: 0, max: 1000 },
  { label: '1 000 – 5 000₴', min: 1000, max: 5000 },
  { label: '5 000 – 10 000₴', min: 5000, max: 10000 },
  { label: 'Понад 10 000₴', min: 10000, max: 999999 },
]

export default function ProductFilters({
  filters,
  onClose,
  categories,
  brands,
  mode,
  rootCategory = null,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [minInput, setMinInput] = useState('')
  const [maxInput, setMaxInput] = useState('')

  const createURL = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete('page')
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname, searchParams]
  )

  function pushURL(mutate: (params: URLSearchParams) => void) {
    router.push(createURL(mutate), { scroll: false })
  }

  function clearFiltersOnly() {
    pushURL(params => {
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

  const { childrenByParentId } = useMemo(() => buildCategoryMaps(categories), [categories])

  const subcategoryTree = useMemo(() => {
    if (!rootCategory) return []
    return getDirectChildren(categories, rootCategory.id).map(child => ({
      ...child,
      children: childrenByParentId.get(child.id) ?? [],
    }))
  }, [categories, rootCategory, childrenByParentId])

  useEffect(() => {
    if (filters.categories.length === 0) return
    setOpenSections(prev => {
      const next = { ...prev }
      for (const node of subcategoryTree) {
        if (
          filters.categories.includes(node.slug) ||
          node.children.some(c => filters.categories.includes(c.slug))
        ) {
          next[node.slug] = true
        }
      }
      return next
    })
  }, [filters.categories, subcategoryTree])

  function setCategories(next: string[]) {
    const unique = Array.from(new Set(next.map(s => s.trim()).filter(Boolean)))
    pushURL(params => {
      params.delete('category')
      for (const slug of unique) params.append('category', slug)
    })
  }

  /** Одна підкатегорія за раз; повторний клік знімає вибір. */
  function selectCategory(slug: string) {
    if (filters.categories.length === 1 && filters.categories[0] === slug) {
      setCategories([])
      return
    }
    setCategories([slug])
  }

  function setBrands(next: string[]) {
    const unique = Array.from(new Set(next.map(s => s.trim()).filter(Boolean)))
    pushURL(params => {
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
    pushURL(params => {
      if (min === undefined) params.delete('minPrice')
      else params.set('minPrice', String(min))
      if (max === undefined) params.delete('maxPrice')
      else params.set('maxPrice', String(max))
    })
  }

  function applyPrice() {
    const min = minInput.trim() === '' ? undefined : Number(minInput)
    const max = maxInput.trim() === '' ? undefined : Number(maxInput)
    if (min !== undefined && !Number.isFinite(min)) return
    if (max !== undefined && !Number.isFinite(max)) return
    if (min !== undefined && max !== undefined && min > max) {
      setPriceRange(max, min)
      return
    }
    setPriceRange(min, max)
  }

  function toggleInStock(next: boolean) {
    pushURL(params => {
      if (next) params.set('inStock', '1')
      else params.delete('inStock')
    })
  }

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Фільтри</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={clearFiltersOnly}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Очистити
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[10px] text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {mode === 'category' && subcategoryTree.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Підкатегорії
          </h4>
          <ul className="flex flex-col gap-1">
            {subcategoryTree.map(node => {
              const hasKids = node.children.length > 0
              const isOpen = !!openSections[node.slug]
              const selected = filters.categories[0] === node.slug
              const childSelected = node.children.some(c => filters.categories[0] === c.slug)

              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasKids) {
                        setOpenSections(prev => ({ ...prev, [node.slug]: !prev[node.slug] }))
                        return
                      }
                      selectCategory(node.slug)
                    }}
                    aria-pressed={!hasKids ? selected : undefined}
                    aria-expanded={hasKids ? isOpen : undefined}
                    className={cn(
                      'no-focus-outline w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-[10px] text-left text-sm transition-colors',
                      'outline-none ring-0 border-0 shadow-none focus:outline-none focus-visible:outline-none',
                      selected || childSelected
                        ? 'bg-accent/15 text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    )}
                  >
                    <span className="truncate">{node.name_ua}</span>
                    {hasKids && (
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="text-text-muted shrink-0"
                      >
                        <ChevronDown size={14} />
                      </motion.span>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {hasKids && isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-3 mt-1 flex flex-col gap-1"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => selectCategory(node.slug)}
                            aria-pressed={selected}
                            className={cn(
                              'no-focus-outline w-full text-left px-2 py-1.5 rounded-[10px] text-sm transition-colors',
                              'outline-none ring-0 border-0 shadow-none focus:outline-none focus-visible:outline-none',
                              selected
                                ? 'bg-accent/15 text-text-primary font-medium'
                                : 'text-text-secondary hover:bg-bg-elevated'
                            )}
                          >
                            Усі з «{node.name_ua}»
                          </button>
                        </li>
                        {node.children.map(child => {
                          const childOn = filters.categories[0] === child.slug
                          return (
                            <li key={child.id}>
                              <button
                                type="button"
                                onClick={() => selectCategory(child.slug)}
                                aria-pressed={childOn}
                                className={cn(
                                  'no-focus-outline w-full text-left px-2 py-1.5 rounded-[10px] text-sm transition-colors',
                                  'outline-none ring-0 border-0 shadow-none focus:outline-none focus-visible:outline-none',
                                  childOn
                                    ? 'bg-accent/15 text-text-primary font-medium'
                                    : 'text-text-secondary hover:bg-bg-elevated'
                                )}
                              >
                                {child.name_ua}
                              </button>
                            </li>
                          )
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Ціна
        </h4>
        <form
          onSubmit={e => {
            e.preventDefault()
            applyPrice()
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              inputMode="numeric"
              value={minInput}
              onChange={e => setMinInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Мін, ₴"
              className="no-focus-outline h-9 bg-bg-surface border border-border rounded-[10px] px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent"
            />
            <input
              inputMode="numeric"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Макс, ₴"
              className="no-focus-outline h-9 bg-bg-surface border border-border rounded-[10px] px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent"
            />
          </div>
          <Button size="sm" className="w-full rounded-[10px]" type="submit">
            Застосувати
          </Button>
        </form>
        <ul className="mt-3 flex flex-col gap-1">
          {PRICE_RANGES.map(range => (
            <li key={range.label}>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated cursor-pointer">
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

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Бренд
        </h4>
        <ul className="flex flex-col gap-1">
          {brands.slice(0, brandsOpen ? brands.length : 6).map(brand => (
            <li key={brand.id}>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-bg-elevated cursor-pointer">
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
          {brands.length > 6 && (
            <li>
              <button
                type="button"
                onClick={() => setBrandsOpen(v => !v)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-[10px] text-xs text-text-secondary hover:bg-bg-elevated"
              >
                <span>{brandsOpen ? 'Згорнути' : `Показати ще (${brands.length - 6})`}</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', brandsOpen && 'rotate-180')}
                />
              </button>
            </li>
          )}
        </ul>
      </div>

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
