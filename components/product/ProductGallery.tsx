'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  name: string
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const pointerStartXRef = useRef<number | null>(null)

  const safeImages = (images?.filter(Boolean).length ? images.filter(Boolean) : ['/images/placeholder-product.svg'])
  const safeActive = Math.min(active, safeImages.length - 1)

  const prev = useCallback(() => {
    if (safeImages.length <= 1) return
    setActive(i => (i - 1 + safeImages.length) % safeImages.length)
  }, [safeImages.length])

  const next = useCallback(() => {
    if (safeImages.length <= 1) return
    setActive(i => (i + 1) % safeImages.length)
  }, [safeImages.length])

  useEffect(() => {
    if (!zoomed) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setZoomed(false)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [zoomed, next, prev])

  useEffect(() => {
    if (!zoomed) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [zoomed])

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
              className="w-full max-w-6xl cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-3">
                {safeImages.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Попереднє фото"
                    onClick={e => { e.stopPropagation(); prev() }}
                    className={cn(
                      'shrink-0 size-10 rounded-full',
                      'bg-black/35 hover:bg-black/50 border border-white/15',
                      'flex items-center justify-center text-white'
                    )}
                  >
                    <ChevronLeft size={20} />
                  </button>
                ) : (
                  <div className="shrink-0 w-10" />
                )}

                <div
                  className="relative w-full max-w-2xl aspect-square max-h-[85vh] overflow-hidden rounded-md"
                  onPointerDown={e => {
                    pointerStartXRef.current = e.clientX
                  }}
                  onPointerUp={e => {
                    const startX = pointerStartXRef.current
                    pointerStartXRef.current = null
                    if (startX == null) return
                    const deltaX = e.clientX - startX
                    const threshold = 60
                    if (deltaX > threshold) prev()
                    if (deltaX < -threshold) next()
                  }}
                >
                  {safeImages.length > 1 && (
                    <div className="absolute left-4 top-4 z-10 px-2.5 py-1 rounded-full bg-white/70 border border-black/40 text-black text-xs pointer-events-none">
                      {safeActive + 1} / {safeImages.length}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label="Закрити"
                    onClick={() => setZoomed(false)}
                    className={cn(
                      'absolute right-4 top-4 z-10 size-9 rounded-full',
                      'bg-white/70 hover:bg-white/85 border border-black/40',
                      'flex items-center justify-center text-black'
                    )}
                  >
                    <X size={18} />
                  </button>
                  <Image
                    src={safeImages[safeActive]!}
                    alt={name}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                  />
                </div>

                {safeImages.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Наступне фото"
                    onClick={e => { e.stopPropagation(); next() }}
                    className={cn(
                      'shrink-0 size-10 rounded-full',
                      'bg-black/35 hover:bg-black/50 border border-white/15',
                      'flex items-center justify-center text-white'
                    )}
                  >
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <div className="shrink-0 w-10" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
