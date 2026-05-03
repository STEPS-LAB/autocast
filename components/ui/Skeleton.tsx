import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'rect' | 'circle' | 'text'
}

export default function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        className
      )}
      aria-hidden="true"
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border rounded-md overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton className="h-9 w-full rounded" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
