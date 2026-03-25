'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="uk">
      <body className="min-h-dvh flex flex-col">
        <div className="container-xl py-24">
          <div className="max-w-xl mx-auto bg-bg-surface border border-border rounded-md p-6">
            <h1 className="text-xl font-semibold text-text-primary">Критична помилка</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Виникла критична помилка застосунку. Спробуйте перезавантажити сторінку.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => reset()}>
                Перезавантажити
              </Button>
              <Link href="/">
                <Button type="button" variant="secondary">
                  На головну
                </Button>
              </Link>
            </div>

            {process.env['NODE_ENV'] !== 'production' && (
              <pre className="mt-6 text-xs overflow-auto bg-bg-elevated border border-border rounded p-3 text-text-primary">
                {error?.message}
                {'\n'}
                {error?.stack}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}

