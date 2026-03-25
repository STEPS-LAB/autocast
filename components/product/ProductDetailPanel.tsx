'use client'

import { useMemo, useState } from 'react'
import { Package, Truck, ShieldCheck } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import AddToCart from '@/components/product/AddToCart'
import type { ProductCard } from '@/types'
import { formatPrice } from '@/lib/utils'

const GUARANTEES = [
  { icon: Package, label: 'Офіційна гарантія', desc: '12 місяців' },
  { icon: Truck, label: 'Доставка', desc: 'Нова Пошта, 1-2 дні' },
  { icon: ShieldCheck, label: 'Повернення', desc: '14 днів' },
] as const

interface ProductDetailPanelProps {
  nameUa: string
  displayPrice: number
  basePrice: number
  hasSale: boolean
  stock: number
  brandName?: string
  categoryName?: string
  discountPercent: number | null
  productCard: ProductCard
}

/** Права колонка PDP: ціна, наявність, кошик. Без опису — лише в блоці «Про товар». */
export default function ProductDetailPanel({
  nameUa,
  displayPrice,
  basePrice,
  hasSale,
  stock,
  brandName,
  categoryName,
  discountPercent,
  productCard,
}: ProductDetailPanelProps) {
  const [qty, setQty] = useState(1)
  const totalDisplayPrice = useMemo(() => displayPrice * qty, [displayPrice, qty])
  const totalBasePrice = useMemo(() => basePrice * qty, [basePrice, qty])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {brandName && (
          <Badge variant="default">{brandName}</Badge>
        )}
        {categoryName && (
          <Badge variant="muted">{categoryName}</Badge>
        )}
        {discountPercent !== null && (
          <Badge variant="accent">-{discountPercent}%</Badge>
        )}
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug">
        {nameUa}
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-3xl font-bold text-text-primary price">
          {formatPrice(totalDisplayPrice)}
        </span>
        {hasSale && (
          <span className="text-lg text-text-muted line-through price">
            {formatPrice(totalBasePrice)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`size-2 rounded-full ${stock > 0 ? 'bg-success' : 'bg-error'}`}
        />
        <span className={`text-sm ${stock > 0 ? 'text-success' : 'text-error'}`}>
          {stock > 0
            ? `В наявності (${stock} шт.)`
            : 'Немає в наявності'}
        </span>
      </div>

      <AddToCart product={productCard} qty={qty} onQtyChange={setQty} />

      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
        {GUARANTEES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1.5">
            <Icon size={18} className="text-accent" />
            <p className="text-xs font-medium text-text-primary">{label}</p>
            <p className="text-[11px] text-text-muted">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
