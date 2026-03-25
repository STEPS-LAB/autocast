'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Minus, Plus, Check, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore, selectIsWished } from '@/lib/store/wishlist'
import { cn } from '@/lib/utils'
import type { ProductCard } from '@/types'
import { applyDiscountToProduct } from '@/lib/discounts'
import { selectDiscountOverrides, useDiscountStore } from '@/lib/store/discounts'

interface AddToCartProps {
  product: ProductCard
  sticky?: boolean
  qty?: number
  onQtyChange?: (nextQty: number) => void
}

export default function AddToCart({ product, sticky, qty: qtyProp, onQtyChange }: AddToCartProps) {
  const [qtyInternal, setQtyInternal] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore(s => s.addItem)
  const overrides = useDiscountStore(selectDiscountOverrides)
  const displayProduct = applyDiscountToProduct(product, overrides)
  const wished = useWishlistStore(selectIsWished(displayProduct.id))
  const toggleWished = useWishlistStore(s => s.toggle)
  const qty = qtyProp ?? qtyInternal

  useEffect(() => {
    if (qtyProp === undefined) return
    setQtyInternal(qtyProp)
  }, [qtyProp])

  function setQty(next: number) {
    const clamped = Math.max(1, Math.min(displayProduct.stock, next))
    if (onQtyChange) onQtyChange(clamped)
    if (qtyProp === undefined) setQtyInternal(clamped)
  }

  function handleAdd() {
    addItem(displayProduct, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (displayProduct.stock === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center h-12 rounded border border-border text-text-muted text-sm',
        sticky && 'fixed bottom-0 inset-x-0 md:relative md:bottom-auto md:inset-x-auto rounded-none md:rounded border-t md:border'
      )}>
        Немає в наявності
      </div>
    )
  }

  return (
    <div className={cn(
      'flex gap-2 items-stretch',
      sticky && 'fixed bottom-0 inset-x-0 p-3 bg-bg-surface border-t border-border md:relative md:bottom-auto md:inset-x-auto md:p-0 md:bg-transparent md:border-0'
    )}>
      {/* Qty selector */}
      <div className="flex items-stretch border border-border rounded overflow-hidden h-12">
        <button
          onClick={() => setQty(qty - 1)}
          className="w-12 h-12 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center justify-center"
          aria-label="Зменшити"
        >
          <Minus size={14} />
        </button>
        <span className="w-12 h-12 flex items-center text-sm font-medium text-text-primary justify-center tabular-nums">
          {qty}
        </span>
        <button
          onClick={() => setQty(qty + 1)}
          className="w-12 h-12 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center justify-center"
          aria-label="Збільшити"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className={cn(
          'flex-1 h-12 flex items-center justify-center gap-2 rounded font-medium text-sm',
          'transition-all duration-200 active:scale-[0.98]',
          added
            ? 'bg-success text-white'
            : 'bg-accent text-text-primary hover:bg-accent-hover'
        )}
      >
        <AnimatePresence mode="wait">
          {added ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2"
            >
              <Check size={16} />
              Додано!
            </motion.span>
          ) : (
            <motion.span
              key="cart"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2"
            >
              <ShoppingCart size={16} />
              Додати в кошик
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Wishlist */}
      <button
        type="button"
        onClick={() => toggleWished(displayProduct)}
        className={cn(
          'h-12 w-12 rounded border border-border flex items-center justify-center',
          'text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors',
          wished && 'border-accent/30 bg-accent/10 text-accent'
        )}
        aria-label="Додати у вішліст"
      >
        <Heart size={18} className={wished ? 'fill-accent text-accent' : undefined} />
      </button>
    </div>
  )
}
