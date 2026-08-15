'use client'

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useTransition,
  type ReactNode,
} from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { buildCategoryMaps, getDirectChildren } from '@/lib/shop/category-tree'
import type { Facet } from '@/lib/shop/facets'
import {
  vehicleFacetsForSelection,
  type VehicleFacets,
  type VehicleSelections,
} from '@/lib/shop/vehicle'
import type { Brand, Category } from '@/types'

interface FiltersState {
  categories: string[]
  brands: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  specs?: Record<string, string[]>
  vehicle?: VehicleSelections
}

interface ProductFiltersProps {
  filters: FiltersState
  /** Spec-based facets with option counts for the current category. */
  facets?: Facet[]
  /** Cascading make → model → year options (empty when unsupported). */
  vehicleFacets?: VehicleFacets
  onClose?: () => void
  categories: Category[]
  brands: Brand[]
  /** hub = /shop; category = /shop/[slug] with subcategory accordions */
  mode: 'hub' | 'category'
  rootCategory?: Category | null
  /** Live roots whose children should appear in subcategory filters. */
  rootCategories?: Category[]
  /** Desktop sidebar: keep title fixed and scroll filter sections independently. */
  scrollable?: boolean
  /** Lifted optimistic vehicle selection (keeps chips / both sidebars in sync). */
  onVehicleOptimistic?: (next: VehicleSelections | null) => void
}

const PRICE_RANGES = [
  { label: 'До 1 000₴', min: 0, max: 1000 },
  { label: '1 000 – 5 000₴', min: 1000, max: 5000 },
  { label: '5 000 – 10 000₴', min: 5000, max: 10000 },
  { label: 'Понад 10 000₴', min: 10000, max: 999999 },
]

const OPTION_PREVIEW_LIMIT = 3

/** Hover у стилі кнопки «Очистити» — легкий accent-фон. */
const FILTER_OPTION_HOVER =
  'hover:bg-accent/15 hover:text-text-primary transition-colors'

function FilterAccordion({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="mb-1 border-b border-border last:border-b-0">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="no-focus-outline w-full flex items-center justify-between gap-2 py-3 text-left outline-none"
      >
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</h4>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-text-muted shrink-0"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShowMoreButton({
  expanded,
  hiddenCount,
  onToggle,
}: {
  expanded: boolean
  hiddenCount: number
  onToggle: () => void
}) {
  if (hiddenCount <= 0) return null
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between px-2 py-1.5 rounded-[10px] text-xs text-text-secondary',
        FILTER_OPTION_HOVER
      )}
    >
      <span>{expanded ? 'Згорнути' : `Показати більше (${hiddenCount})`}</span>
      <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
    </button>
  )
}

export default function ProductFilters({
  filters,
  facets = [],
  vehicleFacets = { makes: [], models: [], years: [], cascade: {} },
  onClose,
  categories,
  brands,
  mode,
  rootCategory = null,
  rootCategories,
  scrollable = false,
  onVehicleOptimistic,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [subOpenSections, setSubOpenSections] = useState<Record<string, boolean>>({})
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({})
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  const [minInput, setMinInput] = useState('')
  const [maxInput, setMaxInput] = useState('')

  const specFilters = filters.specs ?? {}
  const vehicle = filters.vehicle ?? {}
  const valueFacets = facets.filter(f => f.type !== 'boolean')
  const booleanFacets = facets.filter(f => f.type === 'boolean')
  const showVehicle = vehicleFacets.makes.length > 0

  const { models: vehicleModels, years: vehicleYears } = useMemo(
    () => vehicleFacetsForSelection(vehicleFacets, vehicle),
    [vehicleFacets, vehicle]
  )

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
    const href = createURL(mutate)
    startTransition(() => {
      router.replace(href, { scroll: false })
    })
  }

  useEffect(() => {
    setMinInput(filters.minPrice === undefined ? '' : String(filters.minPrice))
    setMaxInput(filters.maxPrice === undefined ? '' : String(filters.maxPrice))
  }, [filters.minPrice, filters.maxPrice])

  const { childrenByParentId } = useMemo(() => buildCategoryMaps(categories), [categories])

  const subcategoryTree = useMemo(() => {
    const roots = rootCategories?.length
      ? rootCategories
      : rootCategory
        ? [rootCategory]
        : []
    const seen = new Set<string>()
    const nodes: Array<Category & { children: Category[] }> = []
    for (const root of roots) {
      for (const child of getDirectChildren(categories, root.id)) {
        if (seen.has(child.slug)) continue
        seen.add(child.slug)
        nodes.push({
          ...child,
          children: childrenByParentId.get(child.id) ?? [],
        })
      }
    }
    return nodes
  }, [categories, rootCategory, rootCategories, childrenByParentId])

  useEffect(() => {
    if (filters.categories.length === 0) return
    setSubOpenSections(prev => {
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

  const valueFacetKeys = valueFacets.map(f => f.key).join(',')
  const booleanFacetKeys = booleanFacets.map(f => f.key).join(',')

  useEffect(() => {
    setAccordionOpen(prev => {
      const next = { ...prev }
      const ensure = (id: string, forceOpen = false) => {
        if (forceOpen) next[id] = true
        else if (next[id] === undefined) next[id] = true
      }

      if (subcategoryTree.length > 0) ensure('subcategories', filters.categories.length > 0)
      if (showVehicle) {
        ensure('vmake', !!vehicle.make)
        if (vehicle.make) ensure('vmodel', !!vehicle.model)
        if (vehicle.model) ensure('vyear', !!vehicle.year)
      }
      for (const key of valueFacetKeys.split(',').filter(Boolean)) {
        ensure(`facet-${key}`, (specFilters[key] ?? []).length > 0)
      }
      if (booleanFacetKeys) {
        ensure(
          'features',
          booleanFacetKeys.split(',').some(k => (specFilters[k] ?? []).length > 0)
        )
      }
      ensure('price', filters.minPrice !== undefined || filters.maxPrice !== undefined)
      ensure('brands', filters.brands.length > 0)
      ensure('stock', !!filters.inStock)
      return next
    })
  }, [
    subcategoryTree.length,
    showVehicle,
    valueFacetKeys,
    booleanFacetKeys,
    specFilters,
    vehicle.make,
    vehicle.model,
    vehicle.year,
    filters.categories.length,
    filters.brands.length,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
  ])

  function isAccordionOpen(id: string) {
    return accordionOpen[id] !== false
  }

  function toggleAccordion(id: string) {
    setAccordionOpen(prev => ({ ...prev, [id]: !(prev[id] !== false) }))
  }

  function isListExpanded(id: string) {
    return !!expandedLists[id]
  }

  function toggleList(id: string) {
    setExpandedLists(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function setCategories(next: string[]) {
    const unique = Array.from(new Set(next.map(s => s.trim()).filter(Boolean)))
    pushURL(params => {
      params.delete('category')
      for (const slug of unique) params.append('category', slug)
    })
  }

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

  function isFacetValueOn(facetKey: string, value: string) {
    return (specFilters[facetKey] ?? []).includes(value)
  }

  function toggleFacetValue(facetKey: string, value: string) {
    const current = new Set(specFilters[facetKey] ?? [])
    if (current.has(value)) current.delete(value)
    else current.add(value)
    pushURL(params => {
      params.delete(facetKey)
      for (const v of current) params.append(facetKey, v)
    })
  }

  function selectVehicleMake(make: string) {
    const next: VehicleSelections =
      vehicle.make === make ? {} : { make }
    onVehicleOptimistic?.(next)
    pushURL(params => {
      if (!next.make) {
        params.delete('vmake')
        params.delete('vmodel')
        params.delete('vyear')
        return
      }
      params.set('vmake', next.make)
      params.delete('vmodel')
      params.delete('vyear')
    })
  }

  function selectVehicleModel(model: string) {
    const next: VehicleSelections =
      vehicle.model === model
        ? { make: vehicle.make }
        : { make: vehicle.make, model }
    onVehicleOptimistic?.(next)
    pushURL(params => {
      if (!next.model) {
        params.delete('vmodel')
        params.delete('vyear')
        return
      }
      params.set('vmodel', next.model)
      params.delete('vyear')
    })
  }

  function selectVehicleYear(year: string) {
    const next: VehicleSelections =
      vehicle.year === year
        ? { make: vehicle.make, model: vehicle.model }
        : { make: vehicle.make, model: vehicle.model, year }
    onVehicleOptimistic?.(next)
    pushURL(params => {
      if (!next.year) {
        params.delete('vyear')
        return
      }
      params.set('vyear', next.year)
    })
  }

  function renderSingleSelectList(
    listId: string,
    options: Array<{ value: string; label: string; count: number }>,
    selected: string | undefined,
    onSelect: (value: string) => void
  ) {
    const expanded = isListExpanded(listId)
    const visible = expanded ? options : options.slice(0, OPTION_PREVIEW_LIMIT)
    return (
      <ul className="flex flex-col gap-1">
        {visible.map(option => {
          const on = selected === option.value
          return (
            <li key={option.value}>
              <label
                className={cn(
                  'flex items-center justify-between gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer',
                  FILTER_OPTION_HOVER
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onSelect(option.value)}
                    className="size-4 accent-accent rounded shrink-0"
                  />
                  <span className="text-sm text-text-secondary truncate">{option.label}</span>
                </span>
                <span className="text-xs text-text-muted shrink-0">{option.count}</span>
              </label>
            </li>
          )
        })}
        <li>
          <ShowMoreButton
            expanded={expanded}
            hiddenCount={options.length - OPTION_PREVIEW_LIMIT}
            onToggle={() => toggleList(listId)}
          />
        </li>
      </ul>
    )
  }

  const visibleSubcategories = isListExpanded('subcategories')
    ? subcategoryTree
    : subcategoryTree.slice(0, OPTION_PREVIEW_LIMIT)

  const visibleBrands = isListExpanded('brands')
    ? brands
    : brands.slice(0, OPTION_PREVIEW_LIMIT)

  const visiblePriceRanges = isListExpanded('price-ranges')
    ? PRICE_RANGES
    : PRICE_RANGES.slice(0, OPTION_PREVIEW_LIMIT)

  const visibleBooleanFacets = isListExpanded('features')
    ? booleanFacets
    : booleanFacets.slice(0, OPTION_PREVIEW_LIMIT)

  return (
    <aside
      className={cn(
        'w-full',
        scrollable && 'flex h-full max-h-[calc(100vh-6.5rem)] flex-col min-h-0'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between mb-3',
          scrollable && 'shrink-0'
        )}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Фільтри</h3>
        </div>
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

      <div
        className={cn(
          scrollable && 'min-h-0 flex-1 overflow-y-auto overscroll-contain pr-[10px]'
        )}
      >
      {mode === 'category' && subcategoryTree.length > 0 && (
        <FilterAccordion
          id="subcategories"
          title="Підкатегорії"
          open={isAccordionOpen('subcategories')}
          onToggle={() => toggleAccordion('subcategories')}
        >
          <ul className="flex flex-col gap-1">
            {visibleSubcategories.map(node => {
              const hasKids = node.children.length > 0
              const isOpen = !!subOpenSections[node.slug]
              const selected = filters.categories[0] === node.slug
              const childSelected = node.children.some(c => filters.categories[0] === c.slug)

              return (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasKids) {
                        setSubOpenSections(prev => ({ ...prev, [node.slug]: !prev[node.slug] }))
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
                        : cn('text-text-secondary', FILTER_OPTION_HOVER)
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
                                : cn('text-text-secondary', FILTER_OPTION_HOVER)
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
                                    : cn('text-text-secondary', FILTER_OPTION_HOVER)
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
            <li>
              <ShowMoreButton
                expanded={isListExpanded('subcategories')}
                hiddenCount={subcategoryTree.length - OPTION_PREVIEW_LIMIT}
                onToggle={() => toggleList('subcategories')}
              />
            </li>
          </ul>
        </FilterAccordion>
      )}

      {showVehicle && (
        <>
          <FilterAccordion
            id="vmake"
            title="Марка авто"
            open={isAccordionOpen('vmake')}
            onToggle={() => toggleAccordion('vmake')}
          >
            {renderSingleSelectList(
              'vmake',
              vehicleFacets.makes,
              vehicle.make,
              selectVehicleMake
            )}
          </FilterAccordion>

          {vehicle.make && vehicleModels.length > 0 && (
            <FilterAccordion
              id="vmodel"
              title="Модель"
              open={isAccordionOpen('vmodel')}
              onToggle={() => toggleAccordion('vmodel')}
            >
              {renderSingleSelectList(
                'vmodel',
                vehicleModels,
                vehicle.model,
                selectVehicleModel
              )}
            </FilterAccordion>
          )}

          {vehicle.make && vehicle.model && vehicleYears.length > 0 && (
            <FilterAccordion
              id="vyear"
              title="Рік"
              open={isAccordionOpen('vyear')}
              onToggle={() => toggleAccordion('vyear')}
            >
              {renderSingleSelectList(
                'vyear',
                vehicleYears,
                vehicle.year,
                selectVehicleYear
              )}
            </FilterAccordion>
          )}
        </>
      )}

      {valueFacets.map(facet => {
        const listId = `facet-${facet.key}`
        const expanded = isListExpanded(listId)
        const visible = expanded ? facet.options : facet.options.slice(0, OPTION_PREVIEW_LIMIT)
        return (
          <FilterAccordion
            key={facet.key}
            id={listId}
            title={facet.label}
            open={isAccordionOpen(listId)}
            onToggle={() => toggleAccordion(listId)}
          >
            <ul className="flex flex-col gap-1">
              {visible.map(option => (
                <li key={option.value}>
                  <label
                    className={cn(
                      'flex items-center justify-between gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer',
                      FILTER_OPTION_HOVER
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isFacetValueOn(facet.key, option.value)}
                        onChange={() => toggleFacetValue(facet.key, option.value)}
                        className="size-4 accent-accent rounded shrink-0"
                      />
                      <span className="text-sm text-text-secondary truncate">{option.label}</span>
                    </span>
                    <span className="text-xs text-text-muted shrink-0">{option.count}</span>
                  </label>
                </li>
              ))}
              <li>
                <ShowMoreButton
                  expanded={expanded}
                  hiddenCount={facet.options.length - OPTION_PREVIEW_LIMIT}
                  onToggle={() => toggleList(listId)}
                />
              </li>
            </ul>
          </FilterAccordion>
        )
      })}

      {booleanFacets.length > 0 && (
        <FilterAccordion
          id="features"
          title="Можливості"
          open={isAccordionOpen('features')}
          onToggle={() => toggleAccordion('features')}
        >
          <ul className="flex flex-col gap-1">
            {visibleBooleanFacets.map(facet => {
              const option = facet.options[0]
              if (!option) return null
              return (
                <li key={facet.key}>
                  <label
                    className={cn(
                      'flex items-center justify-between gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer',
                      FILTER_OPTION_HOVER
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isFacetValueOn(facet.key, option.value)}
                        onChange={() => toggleFacetValue(facet.key, option.value)}
                        className="size-4 accent-accent rounded shrink-0"
                      />
                      <span className="text-sm text-text-secondary truncate">{facet.label}</span>
                    </span>
                    <span className="text-xs text-text-muted shrink-0">{option.count}</span>
                  </label>
                </li>
              )
            })}
            <li>
              <ShowMoreButton
                expanded={isListExpanded('features')}
                hiddenCount={booleanFacets.length - OPTION_PREVIEW_LIMIT}
                onToggle={() => toggleList('features')}
              />
            </li>
          </ul>
        </FilterAccordion>
      )}

      <FilterAccordion
        id="price"
        title="Ціна"
        open={isAccordionOpen('price')}
        onToggle={() => toggleAccordion('price')}
      >
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
          {visiblePriceRanges.map(range => (
            <li key={range.label}>
              <label
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer',
                  FILTER_OPTION_HOVER
                )}
              >
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
          <li>
            <ShowMoreButton
              expanded={isListExpanded('price-ranges')}
              hiddenCount={PRICE_RANGES.length - OPTION_PREVIEW_LIMIT}
              onToggle={() => toggleList('price-ranges')}
            />
          </li>
        </ul>
      </FilterAccordion>

      <FilterAccordion
        id="brands"
        title="Бренд"
        open={isAccordionOpen('brands')}
        onToggle={() => toggleAccordion('brands')}
      >
        <ul className="flex flex-col gap-1">
          {visibleBrands.map(brand => (
            <li key={brand.id}>
              <label
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer',
                  FILTER_OPTION_HOVER
                )}
              >
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
          <li>
            <ShowMoreButton
              expanded={isListExpanded('brands')}
              hiddenCount={brands.length - OPTION_PREVIEW_LIMIT}
              onToggle={() => toggleList('brands')}
            />
          </li>
        </ul>
      </FilterAccordion>

      <FilterAccordion
        id="stock"
        title="Наявність"
        open={isAccordionOpen('stock')}
        onToggle={() => toggleAccordion('stock')}
      >
        <label className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-[10px] hover:bg-accent/15 transition-colors">
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
      </FilterAccordion>
      </div>
    </aside>
  )
}
