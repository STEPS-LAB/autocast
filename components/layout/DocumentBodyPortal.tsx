'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Вище за `body::after` (z-index: 9998) у `app/globals.css`, інакше шари «зникають» під виньєткою. */
export const DRAWER_BACKDROP_Z = 'z-[10000]'
export const DRAWER_PANEL_Z = 'z-[10001]'

/** Fixed-оверлеї в `document.body` — стабільніший stacking і exit на мобільних WebKit. */
export default function DocumentBodyPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setTarget(document.body)
  }, [])
  if (!target) return null
  return createPortal(children, target)
}
