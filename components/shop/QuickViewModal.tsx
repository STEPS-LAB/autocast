'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import type { ProductCard } from '@/types'
import { applyDiscountToProduct } from '@/lib/discounts'
import { selectDiscountOverrides, useDiscountStore } from '@/lib/store/discounts'

interface QuickViewModalProps {
  product: ProductCard | null
  onClose: () => void
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const addItem = useCartStore(s => s.addItem)
  const overrides = useDiscountStore(selectDiscountOverrides)

  if (!product) return null
  const discountedProduct = applyDiscountToProduct(product, overrides)

  const discount = discountedProduct.sale_price
    ? getDiscountPercent(discountedProduct.price, discountedProduct.sale_price)
    : null
  const displayPrice = discountedProduct.sale_price ?? discountedProduct.price

  function handleAddToCart() {
    addItem(discountedProduct)
    onClose()
  }

  return (
    <Modal open={!!product} onClose={onClose} size="lg">
      <div className="flex flex-col sm:flex-row gap-6 mt-2">
        {/* Image */}
        <div className="relative w-full sm:w-64 aspect-square rounded-md overflow-hidden bg-bg-elevated shrink-0">
          {discountedProduct.images[0] && (
            <Image
              src={discountedProduct.images[0]}
              alt={discountedProduct.name_ua}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 256px"
              priority
            />
          )}
          {discount && (
            <div className="absolute top-2 left-2">
              <Badge variant="accent">-{discount}%</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {discountedProduct.brand && (
            <span className="text-xs text-text-muted uppercase tracking-wider">
              {discountedProduct.brand.name}
            </span>
          )}
          {discountedProduct.category && (
            <span className="text-xs text-accent">{discountedProduct.category.name_ua}</span>
          )}

          <h3 className="text-base font-semibold text-text-primary leading-snug">
            {discountedProduct.name_ua}
          </h3>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-text-primary price">
              {formatPrice(displayPrice)}
            </span>
            {discountedProduct.sale_price && (
              <span className="text-sm text-text-muted line-through price">
                {formatPrice(discountedProduct.price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={
                discountedProduct.stock > 0
                  ? 'text-xs text-success'
                  : 'text-xs text-error'
              }
            >
              {discountedProduct.stock > 0
                ? `✓ В наявності (${discountedProduct.stock} шт.)`
                : '✗ Немає в наявності'}
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button
              fullWidth
              onClick={handleAddToCart}
              disabled={discountedProduct.stock === 0}
              className="gap-2"
            >
              <ShoppingCart size={16} />
              Додати в кошик
            </Button>
            <Link
              href={`/product/${discountedProduct.slug}`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors py-2"
            >
              Детальніше <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  )
}
