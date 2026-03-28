'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, User, Menu, X, Search, Heart } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/lib/store/cart'
import { useWishlistStore, selectWishlistCount } from '@/lib/store/wishlist'
import { cn } from '@/lib/utils'
import SmartSearchBar from '@/components/search/SmartSearchBar'
import DocumentBodyPortal, { DRAWER_BACKDROP_Z, DRAWER_PANEL_Z } from '@/components/layout/DocumentBodyPortal'

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
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
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

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          !scrolled
            ? (isAdminPage ? 'bg-bg-surface/95 border-b border-border/70 backdrop-blur-xl' : 'bg-transparent')
            : 'border-b border-white/15 bg-bg-surface/85 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.18)]',
          scrolled && 'shadow-[0_10px_32px_rgba(0,0,0,0.22)]',
          isAdminPage && scrolled && 'border-border/70'
        )}
      >
        <div className="container-xl">
          <div className="flex items-center justify-between h-[70px] gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <span className="font-bold text-[22px] tracking-tight text-text-primary">
                AUTO<span className="text-accent">CAST</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(link => {
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
                        ? 'text-text-primary'
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
            <div className="hidden md:flex flex-1 max-w-xs">
              <SmartSearchBar compact />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                className="md:hidden p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
                className="relative p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
                className="relative p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
                className="hidden md:inline-flex p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label="Акаунт"
              >
                <User size={20} />
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
