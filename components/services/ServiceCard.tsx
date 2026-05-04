'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ServiceSlug } from '@/lib/data/services'
import { SERVICES } from '@/lib/data/services'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  slug: ServiceSlug
  variant?: 'light' | 'dark'
  size?: 'default' | 'large'
  index?: number
  /** Без кільця/аутлайну при фокусі (наприклад, картки в темній секції на головній) */
  hideFocusOutline?: boolean
  /** Без тонкої рамки навколо плашки з іконкою (світла тема) */
  hideIconBadgeBorder?: boolean
  imageSizes?: string
}

export default function ServiceCard({
  slug,
  variant = 'light',
  size = 'default',
  index = 0,
  hideFocusOutline = false,
  hideIconBadgeBorder = false,
  imageSizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: ServiceCardProps) {
  const service = SERVICES.find(s => s.slug === slug)
  if (!service) return null

  const { title, shortDescription, icon: Icon, image } = service
  const isDark = variant === 'dark'
  const isLarge = size === 'large'

  const inner = (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'relative shrink-0 aspect-[4/3] overflow-hidden bg-bg-elevated',
          isLarge ? 'rounded-t-lg' : 'rounded-t-md'
        )}
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={imageSizes}
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t',
            isDark
              ? 'from-graphite-deep/92 via-graphite/20 to-transparent'
              : 'from-graphite-deep/75 via-graphite/12 to-transparent'
          )}
        />
        <div className="absolute inset-0 bg-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div
          className={cn(
            'pointer-events-none absolute inline-flex items-center justify-center rounded-lg bg-graphite-deep/70 backdrop-blur-sm shadow-[0_4px_14px_-4px_rgba(0,0,0,0.45)]',
            'outline-none ring-0 [&_svg]:outline-none [&_svg]:focus:outline-none',
            isLarge ? 'right-3 top-3 size-11 md:right-4 md:top-4 md:size-12' : 'right-3 top-3 size-10',
            !isDark && !hideIconBadgeBorder && 'border border-white/20'
          )}
          aria-hidden
        >
          <Icon size={isLarge ? 20 : 18} className="text-accent outline-none" aria-hidden />
        </div>
      </div>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isLarge ? 'rounded-b-lg p-4 md:p-6' : 'rounded-b-md p-4 md:p-5',
          isDark
            ? 'border-0 bg-gradient-to-br from-white/[0.16] via-white/[0.09] to-white/[0.05]'
            : 'border-0 bg-bg-surface'
        )}
      >
        <h3
          className={cn(
            'font-semibold mb-1.5 transition-colors',
            isLarge ? 'text-base md:text-lg' : 'text-base',
            isDark ? 'text-text-inverse group-hover:text-accent' : 'text-text-primary group-hover:text-accent'
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'leading-relaxed',
            isLarge ? 'text-sm md:text-base line-clamp-4' : 'text-sm line-clamp-3',
            isDark ? 'text-text-inverse-muted' : 'text-text-secondary'
          )}
        >
          {shortDescription}
        </p>
      </div>
    </div>
  )

  return (
    <motion.article
      className="h-full"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link
        href={`/services/${slug}`}
        className={cn(
          'service-card-link group block h-full rounded-md outline-none [-webkit-tap-highlight-color:transparent] [&_svg]:outline-none',
          !hideFocusOutline &&
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          !hideFocusOutline &&
            (isDark ? 'focus-visible:ring-offset-graphite-deep' : 'focus-visible:ring-offset-bg-primary'),
          hideFocusOutline && 'no-focus-outline'
        )}
      >
        <div
          className={cn(
            'h-full overflow-hidden transition-[transform,box-shadow,border-color] duration-300',
            isLarge ? 'rounded-lg' : 'rounded-md',
            isDark
              ? 'service-card-lift-dark border-0 bg-transparent ring-0'
              : 'micro-lift border border-border bg-bg-surface md:hover:ring-2 md:hover:ring-accent/20'
          )}
        >
          {inner}
        </div>
      </Link>
    </motion.article>
  )
}
