export default function ProductLoading() {
  return (
    <div className="container-xl py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square rounded bg-bg-elevated skeleton" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-bg-elevated skeleton" />
          <div className="h-5 w-1/3 rounded bg-bg-elevated skeleton" />
          <div className="h-24 w-full rounded bg-bg-elevated skeleton" />
          <div className="h-12 w-48 rounded bg-bg-elevated skeleton" />
        </div>
      </div>
    </div>
  )
}
