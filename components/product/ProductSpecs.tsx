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
      <dl className="divide-y divide-border border border-border rounded-md overflow-hidden">
        {entries.map(([key, value]) => (
          <div key={key} className="flex px-4 py-2.5 hover:bg-bg-elevated transition-colors">
            <dt className="w-1/2 text-sm text-text-muted shrink-0">{key}</dt>
            <dd className="text-sm font-medium text-text-primary font-mono">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
