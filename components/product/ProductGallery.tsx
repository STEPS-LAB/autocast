'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  name: string
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const safeImages = (images?.filter(Boolean).length ? images.filter(Boolean) : ['/images/placeholder-product.svg'])
  const safeActive = Math.min(active, safeImages.length - 1)

  const prev = () => setActive(i => (i - 1 + safeImages.length) % safeImages.length)
  const next = () => setActive(i => (i + 1) % safeImages.length)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className={cn(
          'relative aspect-square rounded-md overflow-hidden bg-bg-elevated border border-border',
          'cursor-zoom-in group'
        )}
        onClick={() => setZoomed(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={safeActive}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={safeImages[safeActive]!}
              alt={`${name} — ${safeActive + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={safeActive === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 p-1.5 bg-bg-primary/60 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={14} className="text-text-secondary" />
        </div>

        {/* Nav arrows (if multiple) */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full',
                'bg-bg-primary/70 backdrop-blur-sm border border-border',
                'flex items-center justify-center text-text-secondary hover:text-text-primary',
                'opacity-0 group-hover:opacity-100 transition-opacity'
              )}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full',
                'bg-bg-primary/70 backdrop-blur-sm border border-border',
                'flex items-center justify-center text-text-secondary hover:text-text-primary',
                'opacity-0 group-hover:opacity-100 transition-opacity'
              )}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2">
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'relative size-16 rounded border-2 overflow-hidden shrink-0 transition-colors',
                i === safeActive
                  ? 'border-accent'
                  : 'border-border hover:border-border-light'
              )}
            >
              <Image
                src={img}
                alt={`${name} thumb ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      <AnimatePresence>
        {zoomed && safeImages[safeActive] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] w-full aspect-square"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={safeImages[safeActive]!}
                alt={name}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
