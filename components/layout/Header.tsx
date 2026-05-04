'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, User, Menu, X, Search, Heart, ChevronDown } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/lib/store/cart'
import { useWishlistStore, selectWishlistCount } from '@/lib/store/wishlist'
import { cn } from '@/lib/utils'
import SmartSearchBar from '@/components/search/SmartSearchBar'
import DocumentBodyPortal, { DRAWER_BACKDROP_Z, DRAWER_PANEL_Z } from '@/components/layout/DocumentBodyPortal'
import ServicesMenu from '@/components/layout/ServicesMenu'
import SiteLogo from '@/components/layout/SiteLogo'
import { SERVICES } from '@/lib/data/services'

const NAV_LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/shop', label: 'Магазин' },
  { href: '/services', label: 'Послуги' },
  { href: '/about', label: 'Про нас' },
  { href: '/contact', label: 'Контакти' },
]

export default function Header() {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')
  const isServiceDetail = /^\/services\/[^/]+$/.test(pathname)
  const [scrolled, setScrolled] = useState(false)
  /** Avoid scroll-dependent chrome on the first client paint so SSR HTML matches hydration. */
  const [hasMounted, setHasMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(true)
  const count = useCartStore(selectCartCount)
  const openCart = useCartStore(s => s.openCart)
  const closeCart = useCartStore(s => s.closeCart)
  const wishlistCount = useWishlistStore(selectWishlistCount)
  const openWishlist = useWishlistStore(s => s.open)
  const closeWishlist = useWishlistStore(s => s.close)

  const slideDuration = 0.32
  const slideEaseOpen: [number, number, number, number] = [0.32, 0.72, 0, 1]
  const slideEaseClose: [number, number, number, number] = [1, 0, 0.68, 0.28]

  function unlockBodyScrollAfterMobileMenu() {
    const cartOpen = useCartStore.getState().isOpen
    const wishOpen = useWishlistStore.getState().isOpen
    if (!cartOpen && !wishOpen) {
      document.body.style.overflow = ''
    }
  }

  useEffect(() => {
    setHasMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 1)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMobileSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    }
  }, [mobileOpen])

  /** Не викликати closeCart/closeWishlist у setMobileOpen(updater) — React може виконати updater під час рендеру. */
  useEffect(() => {
    if (!mobileOpen) return
    closeCart()
    closeWishlist()
  }, [mobileOpen, closeCart, closeWishlist])

  useEffect(() => () => {
    unlockBodyScrollAfterMobileMenu()
  }, [])

  const scrolledForShell = isAdminPage ? scrolled : isServiceDetail || (hasMounted && scrolled)
  const publicDarkBar = !isAdminPage && (isServiceDetail || (hasMounted && scrolled))

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-[45] transition-all duration-300',
          !scrolledForShell
            ? isAdminPage
              ? 'border-b border-border/70 bg-bg-surface/95 backdrop-blur-xl'
              : 'bg-transparent'
            : isAdminPage
              ? 'border-b border-border/70 bg-bg-surface/95 backdrop-blur-xl shadow-[0_10px_32px_rgba(0,0,0,0.22)]'
              : 'border-b-0 bg-graphite-deep/68 backdrop-blur-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.35)]'
        )}
      >
        <div className="container-xl">
          <div className="flex h-[70px] min-w-0 flex-nowrap items-center justify-between gap-4">
            <SiteLogo variant="header" darkBar={publicDarkBar} />

            {/* Desktop nav */}
            <nav className="hidden flex-nowrap items-center gap-6 md:flex">
              {NAV_LINKS.map(link => {
                if (link.href === '/services') {
                  return (
                    <ServicesMenu
                      key={`nav-services-${pathname}`}
                      publicDarkBar={publicDarkBar}
                    />
                  )
                }
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300',
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
                    )}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-px bg-accent"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Search (desktop) */}
            <div className="hidden min-h-0 min-w-0 max-w-xs flex-1 items-center md:flex">
              <SmartSearchBar compact />
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-nowrap items-center gap-1">
              <button
                className={cn(
                  'md:hidden p-2 rounded transition-colors',
                  publicDarkBar
                    ? 'text-white/78 hover:text-white hover:bg-white/12'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
                onClick={() => setMobileSearchOpen(v => !v)}
                aria-label="Пошук"
                aria-expanded={mobileSearchOpen}
                aria-controls="mobile-header-search"
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false)
                  setMobileSearchOpen(false)
                  openWishlist()
                }}
                className={cn(
                  'relative p-2 rounded transition-colors',
                  publicDarkBar
                    ? 'text-white/78 hover:text-white hover:bg-white/12'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
                aria-label={`Вішліст (${wishlistCount})`}
              >
                <Heart size={20} />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      key={wishlistCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-accent text-text-primary text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false)
                  setMobileSearchOpen(false)
                  openCart()
                }}
                className={cn(
                  'relative p-2 rounded transition-colors',
                  publicDarkBar
                    ? 'text-white/78 hover:text-white hover:bg-white/12'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
                aria-label={`Кошик (${count})`}
              >
                <ShoppingCart size={20} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-accent text-text-primary text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <Link
                href="/account"
                className={cn(
                  'hidden md:inline-flex p-2 rounded transition-colors',
                  publicDarkBar
                    ? 'text-white/78 hover:text-white hover:bg-white/12'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
                aria-label="Акаунт"
              >
                <User size={20} />
              </Link>

              {/* Mobile menu toggle */}
              <button
                className={cn(
                  'md:hidden p-2 rounded transition-colors',
                  publicDarkBar
                    ? 'text-white/78 hover:text-white hover:bg-white/12'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
                onClick={() => {
                  setMobileSearchOpen(false)
                  setMobileOpen(v => !v)
                }}
                aria-label="Меню"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <AnimatePresence initial={false}>
            {mobileSearchOpen && (
              <motion.div
                id="mobile-header-search"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="md:hidden pb-3"
              >
                <SmartSearchBar compact autoFocus />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Мобільне меню: портал + z вище body::after; окремі AnimatePresence для exit на WebKit */}
      <DocumentBodyPortal>
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              key="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: {
                  duration: slideDuration,
                  ease: slideEaseClose,
                },
              }}
              transition={{
                duration: slideDuration * 0.85,
                ease: slideEaseOpen,
              }}
              className={cn(
                'fm-drawer-backdrop fixed inset-0 bg-black/35 backdrop-blur-sm md:hidden',
                DRAWER_BACKDROP_Z
              )}
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence onExitComplete={unlockBodyScrollAfterMobileMenu}>
          {mobileOpen ? (
            <motion.div
              key="mobile-menu-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{
                x: '100%',
                transition: {
                  type: 'tween',
                  duration: slideDuration,
                  ease: slideEaseClose,
                },
              }}
              transition={{
                type: 'tween',
                duration: slideDuration,
                ease: slideEaseOpen,
              }}
              style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
              className={cn(
                'fm-drawer-panel fixed right-0 top-0 bottom-0 w-full max-w-xs min-w-0 border-l border-border bg-bg-surface/95 backdrop-blur-xl shadow-2xl flex flex-col pt-20 pb-8 px-6 overflow-hidden touch-pan-y md:hidden',
                DRAWER_PANEL_Z
              )}
            >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Закрити меню"
            >
              <X size={20} />
            </button>

            <nav className="flex flex-col gap-1">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-3 rounded text-base font-medium transition-colors',
                  pathname.startsWith('/account')
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                Акаунт
              </Link>

              {NAV_LINKS.map(link => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href)
                if (link.href === '/services') {
                  return (
                    <div key={link.href} className="flex flex-col gap-0.5">
                      <div className="flex items-stretch gap-0.5 rounded-md">
                        <Link
                          href="/services"
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'min-w-0 flex-1 px-3 py-3 rounded-l-md text-base font-medium transition-colors',
                            isActive
                              ? 'bg-accent/10 text-accent'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                          )}
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          aria-expanded={mobileServicesOpen}
                          aria-controls="mobile-nav-services-sub"
                          id="mobile-nav-services-trigger"
                          onClick={() => setMobileServicesOpen(v => !v)}
                          className="shrink-0 rounded-r-md px-2.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                          aria-label={mobileServicesOpen ? 'Згорнути підпункти послуг' : 'Розгорнути підпункти послуг'}
                        >
                          <ChevronDown
                            size={20}
                            className={cn(
                              'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                              mobileServicesOpen && 'rotate-180'
                            )}
                            aria-hidden
                          />
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {mobileServicesOpen ? (
                          <motion.div
                            key="mobile-services-sub"
                            id="mobile-nav-services-sub"
                            role="region"
                            aria-labelledby="mobile-nav-services-trigger"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="ml-3 flex flex-col gap-0.5 border-l border-border py-1 pl-3">
                              {SERVICES.map(s => {
                                const subActive = pathname === `/services/${s.slug}`
                                return (
                                  <Link
                                    key={s.slug}
                                    href={`/services/${s.slug}`}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                      'px-3 py-2 rounded text-sm font-medium transition-colors duration-200',
                                      subActive
                                        ? 'bg-accent/10 text-accent'
                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                                    )}
                                  >
                                    {s.title}
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-3 py-3 rounded text-base font-medium transition-colors',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        ) : null}
        </AnimatePresence>
      </DocumentBodyPortal>
    </>
  )
}
