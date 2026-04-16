import { ProductGridSkeleton } from '@/components/ui/Skeleton'

export default function ShopLoading() {
  return (
    <div className="container-xl py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="h-9 w-24 rounded bg-bg-elevated skeleton" />
        <div className="h-9 w-32 rounded bg-bg-elevated skeleton" />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  )
}
