'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Category } from '@/types'
import Button from '@/components/ui/Button'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const CATEGORY_IMAGES: Record<string, string> = {
  avtozvuk: '/images/avtozvuk.webp',
  avtosvitlo: '/images/avtosvitlo.webp',
  avtoelektronika: '/images/avtoelektronika.webp',
  'zakhyst-vid-uhonu': '/images/signalka.webp',
}

interface FeaturedCategoriesProps {
  categories: Category[]
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const strictDb = process.env['NEXT_PUBLIC_CATALOG_STRICT_DB'] === 'true'
  const displayNameUa = (cat: Category) =>
    cat.slug === 'zakhyst-vid-uhonu' ? 'Охоронні системи' : cat.name_ua

  return (
    <section className="py-20">
      <div className="container-xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <h2 className="text-headline text-text-primary">Категорії товарів</h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Всі категорії <ArrowRight size={14} />
          </Link>
        </motion.div>

        {categories.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {categories.map(cat => {
              return (
              <motion.div key={cat.id} variants={item}>
                <Link href={`/shop/${cat.slug}`} className="group block">
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-bg-surface border border-border mb-3">
                    <Image
                      src={CATEGORY_IMAGES[cat.slug] ?? cat.image_url ?? '/images/placeholder-category.png'}
                      alt={cat.name_ua}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3" />
                    <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors px-0.5">
                    {displayNameUa(cat)}
                  </h3>
                </Link>
              </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <div className="rounded-md border border-border bg-bg-surface p-6 text-center">
            <p className="text-sm text-text-primary font-medium">
              Каталог ще не ініціалізовано.
            </p>
            <p className="text-xs text-text-muted mt-1">
              {strictDb ? 'Увімкнено strict DB режим. Запустіть синхронізацію каталогу в адмінці.' : 'Додайте категорії в адмін-панелі.'}
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/admin">
                <Button size="sm" variant="secondary">
                  Відкрити адмінку
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
