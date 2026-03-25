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
      <dl className="inline-block w-full max-w-[720px] rounded-lg border border-border/80 bg-bg-surface overflow-hidden shadow-[0_10px_24px_rgba(0,0,0,0.10)]">
        {entries.map(([key, value], idx) => (
          <div
            key={key}
            className={[
              'grid grid-cols-1 sm:grid-cols-[minmax(180px,1fr)_2fr] gap-1 sm:gap-3',
              'px-4 py-3',
              'border-b border-border/70 last:border-b-0',
              idx % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-elevated/40',
              'hover:bg-bg-elevated/70 transition-colors',
            ].join(' ')}
          >
            <dt className="text-xs uppercase tracking-wider text-text-muted">
              {key}
            </dt>
            <dd className="text-sm font-semibold text-text-primary leading-snug">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
