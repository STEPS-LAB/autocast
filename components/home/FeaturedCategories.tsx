'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Category } from '@/types'
import {
  imageAltCategory,
  imageTitleCategory,
  linkTitleAllCategories,
  linkTitleCategory,
} from '@/lib/seo/accessibility'

const container = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 1, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface FeaturedCategoriesProps {
  categories: Category[]
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const topLevel = categories.filter((c) => !c.parent_id)

  if (!topLevel.length) return null

  const topLevelForHome = topLevel.slice(0, 4)
  const categoryImage = (imageUrl: string | null) => {
    if (!imageUrl) return '/images/placeholder-category.svg'
    return imageUrl.includes('/storage/v1/object/public/category-images/')
      ? imageUrl
      : '/images/placeholder-category.svg'
  }
  const displayNameUa = (cat: Category) =>
    cat.slug === 'zakhyst-vid-uhonu' ? 'Охоронні системи' : cat.name_ua

  return (
    <section className="py-16 md:py-28 lg:py-36 bg-graphite/5">
      <div className="container-xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-12 md:mb-16"
        >
          <div>
            <h2 className="text-headline text-text-primary">Категорії товарів</h2>
          </div>
          <Link
            href="/shop"
            title={linkTitleAllCategories()}
            className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Всі категорії <ArrowRight size={14} />
          </Link>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-5 md:gap-8"
        >
          {topLevelForHome.map(cat => {
            return (
            <motion.div key={cat.id} variants={item}>
              <Link
                href={`/shop/${cat.slug}`}
                title={linkTitleCategory(displayNameUa(cat))}
                className="group block origin-center transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                <div className="mb-3 md:mb-4 rounded-lg shadow-[0_8px_26px_-10px_rgba(15,23,42,0.14)] transition-shadow duration-300 ease-out group-hover:shadow-[0_22px_48px_-12px_rgba(15,23,42,0.32)]">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-bg-surface border border-border">
                  <Image
                    src={categoryImage(cat.image_url)}
                    alt={imageAltCategory(displayNameUa(cat))}
                    title={imageTitleCategory(displayNameUa(cat))}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, min(700px, calc((100vw - 6rem) / 2))"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite-deep/88 via-graphite/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-5" />
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-text-primary group-hover:text-accent transition-colors px-0.5">
                  {displayNameUa(cat)}
                </h3>
              </Link>
            </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
