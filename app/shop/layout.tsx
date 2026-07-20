import type { ReactNode } from 'react'

/**
 * Фон магазину — як секція «Як ми працюємо» на сторінках послуг:
 * м’який градієнт from-bg-primary → via-bg-surface/40 → to-bg-primary.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[50vh] border-y border-border/70 bg-gradient-to-b from-bg-primary via-bg-surface/40 to-bg-primary">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  )
}
