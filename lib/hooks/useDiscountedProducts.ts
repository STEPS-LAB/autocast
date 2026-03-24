'use client'

import { useMemo } from 'react'
import type { Product, ProductCard } from '@/types'
import { applyDiscountToProduct, applyDiscountsToProducts } from '@/lib/discounts'
import { selectDiscountOverrides, useDiscountStore } from '@/lib/store/discounts'

export function useDiscountedProduct(product: Product): Product {
  const overrides = useDiscountStore(selectDiscountOverrides)
  return useMemo(() => applyDiscountToProduct(product, overrides), [product, overrides])
}

export function useDiscountedProductCard(product: ProductCard): ProductCard {
  const overrides = useDiscountStore(selectDiscountOverrides)
  return useMemo(() => applyDiscountToProduct(product, overrides), [product, overrides])
}

export function useDiscountedProductCards(products: ProductCard[]): ProductCard[] {
  const overrides = useDiscountStore(selectDiscountOverrides)
  return useMemo(() => applyDiscountsToProducts(products, overrides), [products, overrides])
}
