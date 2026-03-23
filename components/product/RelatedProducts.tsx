'use client'

import { motion } from 'framer-motion'
import ProductCard from '@/components/shop/ProductCard'
import type { ProductCard as ProductCardType } from '@/types'

interface RelatedProductsProps {
  products: ProductCardType[]
  title?: string
}

export default function RelatedProducts({
  products,
  title = 'Схожі товари',
}: RelatedProductsProps) {
  if (!products.length) return null

  return (
    <section>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-lg font-semibold text-text-primary mb-6"
      >
        {title}
      </motion.h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 4).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
