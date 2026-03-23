'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/store/cart'
import { cn } from '@/lib/utils'
import type { ProductCard } from '@/types'

interface AddToCartProps {
  product: ProductCard
  sticky?: boolean
}

export default function AddToCart({ product, sticky }: AddToCartProps) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore(s => s.addItem)

  function handleAdd() {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (product.stock === 0) {
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
      'flex gap-2',
      sticky && 'fixed bottom-0 inset-x-0 p-3 bg-bg-surface border-t border-border md:relative md:bottom-auto md:inset-x-auto md:p-0 md:bg-transparent md:border-0'
    )}>
      {/* Qty selector */}
      <div className="flex items-center border border-border rounded overflow-hidden">
        <button
          onClick={() => setQty(q => Math.max(1, q - 1))}
          className="px-3 h-12 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Зменшити"
        >
          <Minus size={14} />
        </button>
        <span className="px-3 h-12 flex items-center text-sm font-medium text-text-primary min-w-[3rem] justify-center tabular-nums">
          {qty}
        </span>
        <button
          onClick={() => setQty(q => Math.min(product.stock, q + 1))}
          className="px-3 h-12 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
            : 'bg-accent text-white hover:bg-accent-hover'
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
    </div>
  )
}
