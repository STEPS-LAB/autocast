'use client'

import { useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Facet } from '@/lib/shop/facets'
import type { VehicleSelections } from '@/lib/shop/vehicle'
import type { Category } from '@/types'

export interface ActiveFiltersState {
  categories: string[]
  brands: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  specs?: Record<string, string[]>
  vehicle?: VehicleSelections
}

interface ActiveFilterChip {
  id: string
  label: string
  remove: (params: URLSearchParams) => void
}

interface ActiveFiltersProps {
  filters: ActiveFiltersState
  facets: Facet[]
  categories: Category[]
}

function buildChips(
  filters: ActiveFiltersState,
  facets: Facet[],
  categories: Category[]
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  const categoryBySlug = new Map(categories.map(c => [c.slug, c]))
  const facetByKey = new Map(facets.map(f => [f.key, f]))
  const vehicle = filters.vehicle ?? {}

  for (const slug of filters.categories) {
    const name = categoryBySlug.get(slug)?.name_ua ?? slug
    chips.push({
      id: `category:${slug}`,
      label: name,
      remove: params => {
        const next = params.getAll('category').filter(v => v !== slug)
        params.delete('category')
        for (const v of next) params.append('category', v)
      },
    })
  }

  if (vehicle.make) {
    chips.push({
      id: 'vehicle:make',
      label: `Марка: ${vehicle.make}`,
      remove: params => {
        params.delete('vmake')
        params.delete('vmodel')
        params.delete('vyear')
      },
    })
  }
  if (vehicle.model) {
    chips.push({
      id: 'vehicle:model',
      label: `Модель: ${vehicle.model}`,
      remove: params => {
        params.delete('vmodel')
        params.delete('vyear')
      },
    })
  }
  if (vehicle.year) {
    chips.push({
      id: 'vehicle:year',
      label: `Рік: ${vehicle.year}`,
      remove: params => {
        params.delete('vyear')
      },
    })
  }

  for (const brand of filters.brands) {
    chips.push({
      id: `brand:${brand}`,
      label: brand,
      remove: params => {
        const next = params.getAll('brand').filter(v => v !== brand)
        params.delete('brand')
        for (const v of next) params.append('brand', v)
      },
    })
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice
    const max = filters.maxPrice
    let label = 'Ціна'
    if (min !== undefined && max !== undefined) {
      label = `${formatPrice(min)} – ${formatPrice(max)}`
    } else if (min !== undefined) {
      label = `від ${formatPrice(min)}`
    } else if (max !== undefined) {
      label = `до ${formatPrice(max)}`
    }
    chips.push({
      id: 'price',
      label,
      remove: params => {
        params.delete('minPrice')
        params.delete('maxPrice')
      },
    })
  }

  if (filters.inStock) {
    chips.push({
      id: 'inStock',
      label: 'В наявності',
      remove: params => {
        params.delete('inStock')
      },
    })
  }

  for (const [key, values] of Object.entries(filters.specs ?? {})) {
    const facet = facetByKey.get(key)
    for (const value of values) {
      const optionLabel =
        facet?.options.find(o => o.value === value)?.label ?? value
      const label =
        facet?.type === 'boolean'
          ? facet.label
          : facet
            ? `${facet.label}: ${optionLabel}`
            : optionLabel
      chips.push({
        id: `spec:${key}:${value}`,
        label,
        remove: params => {
          const next = params.getAll(key).filter(v => v !== value)
          params.delete(key)
          for (const v of next) params.append(key, v)
        },
      })
    }
  }

  return chips
}

export default function ActiveFilters({
  filters,
  facets,
  categories,
}: ActiveFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const chips = useMemo(
    () => buildChips(filters, facets, categories),
    [filters, facets, categories]
  )

  if (chips.length === 0) return null

  function push(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function clearAll() {
    push(params => {
      params.delete('category')
      params.delete('brand')
      params.delete('minPrice')
      params.delete('maxPrice')
      params.delete('inStock')
      params.delete('vmake')
      params.delete('vmodel')
      params.delete('vyear')
      for (const facet of facets) params.delete(facet.key)
      for (const key of Object.keys(filters.specs ?? {})) params.delete(key)
    })
  }

  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
        <span className="text-xs text-text-muted shrink-0">Активні фільтри:</span>
        {chips.map(chip => (
          <button
            key={chip.id}
            type="button"
            onClick={() => push(chip.remove)}
            className="inline-flex items-center gap-1.5 max-w-full h-8 pl-2.5 pr-2 rounded-[10px] border border-border bg-bg-surface text-xs text-text-primary hover:border-accent hover:bg-accent/15 transition-colors"
          >
            <span className="truncate">{chip.label}</span>
            <X size={12} className="shrink-0 text-text-muted" aria-hidden />
            <span className="sr-only">Прибрати фільтр {chip.label}</span>
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={clearAll}
        className="shrink-0 h-9 px-3.5 text-sm font-semibold border-border-light hover:border-accent hover:bg-accent/15"
      >
        <X size={15} aria-hidden />
        Очистити
      </Button>
    </div>
  )
}
