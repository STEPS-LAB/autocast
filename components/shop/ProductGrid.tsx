'use client'

import { useState } from 'react'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import type { ProductCard as ProductCardType } from '@/types'

interface ProductGridProps {
  products: ProductCardType[]
  loading?: boolean
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardType | null>(null)

  if (loading) return <ProductGridSkeleton count={8} />

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="size-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1">
          Товарів не знайдено
        </h3>
        <p className="text-sm text-text-muted">
          Спробуйте змінити фільтри або пошуковий запит
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  )
}
