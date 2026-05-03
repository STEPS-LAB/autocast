'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { SERVICES } from '@/lib/data/services'
import { cn } from '@/lib/utils'

interface ServicesMenuProps {
  publicDarkBar: boolean
}

const CLOSE_DELAY_MS = 120
/** max-w-[40rem] — має збігатися з clamp у `menuMaxWidthPx` */
const MENU_MAX_WIDTH_PX = 40 * 16
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

      {open &&
        portalTarget &&
        createPortal(
            <div
              id="services-nav-menu"
              role="menu"
              aria-labelledby="services-nav-trigger"
              style={{
                left: menuCenterX,
                top: MENU_TOP_PX,
              }}
              className={cn(
                'pointer-events-auto fixed z-[9999] hidden w-[min(40rem,calc(100vw-2rem))] max-w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md shadow-lg outline-none ring-0 md:block',
                publicDarkBar
                  ? 'border-0 bg-graphite-deep/68 backdrop-blur-2xl shadow-[0_16px_48px_-10px_rgba(0,0,0,0.55)]'
                  : 'border border-border/45 bg-bg-surface/92 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)]'
              )}
              onPointerEnter={openMenu}
              onPointerLeave={scheduleClose}
            >
            <div className="overflow-hidden rounded-md px-3 pt-3 pb-1.5 md:px-4 md:pt-4 md:pb-2">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {SERVICES.map(service => {
                  const Icon = service.icon
                  return (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      role="menuitem"
                      className={cn(
                        'services-nav-menuitem group flex items-center gap-3 rounded-md px-2.5 py-2.5 text-left',
                        'outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent]',
                        'translate-x-0 hover:translate-x-0.5 motion-reduce:hover:translate-x-0',
                        publicDarkBar
                          ? 'hover:bg-white/10 focus-visible:bg-white/10'
                          : 'hover:bg-bg-elevated focus-visible:bg-bg-elevated'
                      )}
                    >
                      <span
                        className={cn(
                          'services-nav-menuicon inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/10',
                          publicDarkBar
                            ? 'border-0 ring-0 group-hover:bg-accent/18'
                            : 'border border-accent/25 group-hover:border-accent/45 group-hover:bg-accent/16 group-hover:shadow-[0_0_0_1px_rgb(255_193_7/0.12)]'
                        )}
                      >
                        <Icon size={16} className="text-accent" aria-hidden />
                      </span>
                      <span
                        className={cn(
                          'min-w-0 text-sm font-semibold',
                          publicDarkBar ? 'text-white/95' : 'text-text-primary'
                        )}
                      >
                        {service.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
              <div
                className={cn(
                  'mt-2 pt-2',
                  publicDarkBar ? 'border-t-0' : 'border-t border-border'
                )}
              >
                {publicDarkBar && <div className="mb-2 h-px w-full bg-white/10" aria-hidden />}
                <Link
                  href="/services"
                  role="menuitem"
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium text-accent',
                    'outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent]',
                    'transition-[background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-100',
                    publicDarkBar ? 'hover:bg-accent/15' : 'hover:bg-accent/10'
                  )}
                >
                  Всі послуги
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>,
          portalTarget
        )}
    </div>
  )
}
