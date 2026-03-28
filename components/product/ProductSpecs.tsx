interface ProductSpecsProps {
  specs: Record<string, string>
}

export default function ProductSpecs({ specs }: ProductSpecsProps) {
  const entries = Object.entries(specs)
  if (!entries.length) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
        Характеристики
      </h3>
      <dl className="block w-full max-w-[720px] rounded-lg border border-border/80 bg-bg-surface overflow-hidden shadow-[0_10px_24px_rgba(0,0,0,0.10)] min-w-0">
        {entries.map(([key, value], idx) => (
          <div
            key={key}
            className={[
              'grid grid-cols-1 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-1 sm:gap-3',
              'px-3 sm:px-4 py-3 min-w-0',
              'border-b border-border/70 last:border-b-0',
              idx % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-elevated/40',
              'hover:bg-bg-elevated/70 transition-colors',
            ].join(' ')}
          >
            <dt className="text-xs uppercase tracking-wider text-text-muted break-words min-w-0">
              {key}
            </dt>
            <dd className="text-sm font-semibold text-text-primary leading-snug break-words min-w-0">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
