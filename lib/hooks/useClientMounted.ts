'use client'

import { useEffect, useState } from 'react'

/** true після гідратації — для UI, що залежить від URL або window. */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
