import { ProductGridSkeleton } from '@/components/ui/Skeleton'

export default function ShopLoading() {
  return (
    <div className="container-xl py-10">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 rounded bg-bg-elevated skeleton" />
        <div className="h-4 w-32 rounded bg-bg-elevated skeleton" />
      </div>
      <div className="flex gap-8">
        <div className="hidden lg:block w-56 shrink-0 space-y-3">
          <div className="h-5 w-24 rounded bg-bg-elevated skeleton" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded bg-bg-elevated skeleton" />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-6">
            <div className="h-9 w-40 rounded bg-bg-elevated skeleton" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  )
}
