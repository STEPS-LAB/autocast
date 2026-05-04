'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { SERVICES } from '@/lib/data/services'
import { cn } from '@/lib/utils'

interface ServicesMenuProps {
  publicDarkBar: boolean
}

const CLOSE_DELAY_MS = 120
/** max-w-[60rem] — має збігатися з clamp у `menuMaxWidthPx` (3 колонки) */
const MENU_MAX_WIDTH_PX = 60 * 16
const MENU_VIEWPORT_MARGIN_PX = 16
const MENU_TOP_PX = 70 + 8

function menuMaxWidthPx(viewportW: number) {
  return Math.min(MENU_MAX_WIDTH_PX, viewportW - MENU_VIEWPORT_MARGIN_PX * 2)
}

function clampMenuCenterX(triggerCenterX: number, viewportW: number) {
  const half = menuMaxWidthPx(viewportW) / 2
  const minCenter = half + MENU_VIEWPORT_MARGIN_PX
  const maxCenter = viewportW - half - MENU_VIEWPORT_MARGIN_PX
  return Math.max(minCenter, Math.min(triggerCenterX, maxCenter))
}

export default function ServicesMenu({ publicDarkBar }: ServicesMenuProps) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const [menuCenterX, setMenuCenterX] = useState(0)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  const isActive = pathname.startsWith('/services')

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }, [cancelClose])

  const openMenu = useCallback(() => {
    cancelClose()
    setOpen(true)
  }, [cancelClose])

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const triggerCenterX = rect.left + rect.width / 2
    setMenuCenterX(clampMenuCenterX(triggerCenterX, window.innerWidth))
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function onBlurCapture(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null
    if (next && containerRef.current?.contains(next)) return
    setOpen(false)
  }

  const triggerClass = cn(
    'relative inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    !isActive &&
      'after:absolute after:-bottom-1 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:scale-x-0 after:origin-left',
    !isActive &&
      'after:bg-gradient-to-r after:from-accent/80 after:to-accent/40 after:transition-transform after:duration-300',
    !isActive && 'hover:after:scale-x-100',
    isActive
      ? publicDarkBar
        ? 'text-white'
        : 'text-text-primary'
      : publicDarkBar
        ? 'text-white/72 hover:text-white/95'
        : 'text-text-secondary hover:text-text-primary'
  )

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerEnter={openMenu}
      onPointerLeave={scheduleClose}
      onFocusCapture={openMenu}
      onBlurCapture={onBlurCapture}
    >
      <Link
        ref={triggerRef}
        href="/services"
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="services-nav-menu"
        id="services-nav-trigger"
      >
        <span className="relative z-10">Послуги</span>
        <ChevronDown
          size={14}
          className={cn(
            'relative z-10 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            open && 'rotate-180',
            isActive
              ? publicDarkBar
                ? 'text-white'
                : 'text-text-primary'
              : publicDarkBar
                ? 'text-white/72'
                : 'text-text-secondary'
          )}
          aria-hidden
        />
        {isActive && (
          <motion.span
            layoutId="nav-indicator"
            className="absolute -bottom-1 left-0 right-0 h-px bg-accent"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </Link>

      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                key="services-nav-dropdown"
                id="services-nav-menu"
                role="menu"
                aria-labelledby="services-nav-trigger"
                style={{
                  left: menuCenterX,
                  top: MENU_TOP_PX,
                }}
                className="pointer-events-auto fixed z-[9999] hidden w-[min(60rem,calc(100vw-2rem))] max-w-[min(60rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border-0 bg-graphite-deep/68 shadow-[0_16px_48px_-10px_rgba(0,0,0,0.55)] backdrop-blur-2xl outline-none ring-0 md:block"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.12 }
                    : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
                }
                onPointerEnter={openMenu}
                onPointerLeave={scheduleClose}
              >
                <div className="overflow-hidden rounded-lg px-2.5 pt-2.5 pb-1.5 md:px-3 md:pt-3 md:pb-2">
                  <div className="grid grid-cols-3 grid-rows-2 gap-2 sm:gap-2.5">
                    {SERVICES.map(service => {
                      const Icon = service.icon
                      return (
                        <Link
                          key={service.slug}
                          href={`/services/${service.slug}`}
                          role="menuitem"
                          className="services-nav-menuitem group relative block overflow-hidden rounded-lg ring-1 ring-white/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] outline-none [-webkit-tap-highlight-color:transparent] hover:ring-white/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <div className="relative aspect-[4/3] bg-bg-elevated">
                            <Image
                              src={service.image}
                              alt=""
                              fill
                              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                              sizes="(min-width: 768px) 200px, 33vw"
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-graphite-deep/95 via-graphite-deep/45 to-transparent"
                              aria-hidden
                            />
                            <div
                              className="pointer-events-none absolute inset-0 bg-accent/12 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
                              aria-hidden
                            />
                            <div
                              className="services-nav-menuicon pointer-events-none absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md bg-graphite-deep/72 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                              aria-hidden
                            >
                              <Icon size={15} className="text-accent" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 sm:p-3 sm:pt-10">
                              <span
                                className="line-clamp-2 text-left text-sm font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-base"
                              >
                                {service.title}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  <div className="mt-2 border-t-0 pt-2">
                    <div className="mb-2 h-px w-full bg-white/10" aria-hidden />
                    <Link
                      href="/services"
                      role="menuitem"
                      className="flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium text-accent outline-none [-webkit-tap-highlight-color:transparent] transition-[background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-100 hover:bg-accent/15 focus-visible:outline-none"
                    >
                      Всі послуги
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          portalTarget
        )}
    </div>
  )
}
