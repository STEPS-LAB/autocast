import { Suspense } from 'react'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import ShopContent from '@/components/shop/ShopContent'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Магазин' }

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-xl py-10"><ProductGridSkeleton count={8} /></div>}>
      <ShopContent />
    </Suspense>
  )
}
