'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
      const parts = u.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1]) return `https://www.youtube-nocookie.com/embed/${parts[embedIdx + 1]}`
    }
  } catch {
    return null
  }
  return null
}

export default function ProductVideos({ urls }: { urls: string[] }) {
  const cleaned = useMemo(
    () => urls.map(u => u.trim()).filter(Boolean),
    [urls]
  )

  if (cleaned.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-bg-surface p-6 text-sm text-text-muted">
        Відео оглядів поки немає.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {cleaned.map((url, idx) => {
        const embed = youtubeEmbedUrl(url)
        return (
          <div
            key={`${url}-${idx}`}
            className="rounded-lg border border-border bg-bg-surface overflow-hidden shadow-[0_12px_26px_rgba(0,0,0,0.10)]"
          >
            <div className={cn('relative w-full aspect-video bg-black')}>
              {embed ? (
                <iframe
                  className="absolute inset-0 size-full"
                  src={embed}
                  title={`Відео огляд ${idx + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <video className="absolute inset-0 size-full" controls src={url} />
              )}
            </div>
            <div className="px-4 py-3">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors break-all"
              >
                {url}
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

