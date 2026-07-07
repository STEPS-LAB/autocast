type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>

interface JsonLdProps {
  data: JsonLdValue
}

/** Injects Schema.org JSON-LD for rich snippets and LLM crawlers. */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface JsonLdGraphProps {
  graphs: Array<Record<string, unknown> | null | undefined>
}

/** Combines multiple schemas in a single @graph block; skips null/empty entries. */
export function JsonLdGraph({ graphs }: JsonLdGraphProps) {
  const validGraphs = graphs.filter(
    (graph): graph is Record<string, unknown> => Boolean(graph) && typeof graph === 'object'
  )
  if (validGraphs.length === 0) return null

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': validGraphs,
      }}
    />
  )
}
