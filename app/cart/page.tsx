'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore, selectCartTotal, selectCartCount } from '@/lib/store/cart'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore()
  const total = useCartStore(selectCartTotal)
  const count = useCartStore(selectCartCount)

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="container-xl py-24 flex flex-col items-center text-center gap-6">
          <div className="size-20 rounded-full bg-bg-elevated flex items-center justify-center">
            <ShoppingBag size={36} className="text-text-muted" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Кошик порожній</h1>
            <p className="text-text-secondary">Додайте товари, щоб оформити замовлення</p>
          </div>
          <Link href="/shop">
            <Button size="lg" className="gap-2">
              Перейти в магазин <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container-xl py-10">
        <h1 className="text-headline text-text-primary mb-2">Кошик</h1>
        <p className="text-sm text-text-muted mb-8">{count} товар{count === 1 ? '' : count < 5 ? 'и' : 'ів'}</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-4 p-4 bg-bg-surface border border-border rounded-md"
                >
                  <Link href={`/product/${item.product.slug}`} className="relative size-20 rounded bg-bg-elevated border border-border overflow-hidden shrink-0">
                    {item.product.images[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name_ua}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`} className="text-sm font-medium text-text-primary hover:text-accent transition-colors line-clamp-2">
                      {item.product.name_ua}
                    </Link>
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.product.brand?.name}
                    </p>

                    <div className="flex items-center justify-between mt-3 gap-4">
                      {/* Qty */}
                      <div className="flex items-center border border-border rounded overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm font-medium text-text-primary min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-text-primary price">
                          {formatPrice((item.product.sale_price ?? item.product.price) * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-text-muted hover:text-error transition-colors rounded"
                          aria-label="Видалити"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-bg-surface border border-border rounded-md p-5 sticky top-24">
              <h2 className="text-base font-semibold text-text-primary mb-4">
                Підсумок замовлення
              </h2>
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Товари ({count})</span>
                  <span className="text-text-primary price">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Доставка</span>
                  <span className="text-success">Безкоштовно</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mb-5">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-primary">Разом</span>
                  <span className="text-xl font-bold text-text-primary price">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <Link href="/checkout">
                <Button fullWidth size="lg" className="gap-2">
                  Оформити замовлення <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/shop" className="block text-center text-sm text-text-muted hover:text-text-secondary transition-colors mt-3">
                Продовжити покупки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
