'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/shop/ProductCard'
import type { ProductCard as ProductCardType } from '@/types'
import { linkTitleShop } from '@/lib/seo/accessibility'

interface HomeProductsSectionProps {
  products: ProductCardType[]
}

export default function HomeProductsSection({ products }: HomeProductsSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="py-20 md:py-32 lg:py-40 bg-bg-primary">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div className="max-w-2xl">
            <h2 className="text-headline text-text-primary mb-3">Наші товари</h2>
            <p className="text-text-secondary">
              Добірка з каталогу Autocast — автозвук, магнітоли, світло та відеореєстратори.
            </p>
          </div>
          <Link href="/shop" title={linkTitleShop()} className="block w-full md:w-auto md:shrink-0">
            <Button
              variant="secondary"
              className="micro-pop hover:bg-accent hover:border-accent hover:text-text-primary"
            >
              Перейти в магазин <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 min-w-0 items-stretch">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="min-w-0 h-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <ProductCard product={product} className="h-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
