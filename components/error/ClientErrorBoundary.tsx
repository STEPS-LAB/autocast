'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import Button from '@/components/ui/Button'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
}

export default class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    Sentry.captureException(error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="container-xl py-16">
        <div className="max-w-xl mx-auto bg-bg-surface border border-border rounded-md p-6">
          <h2 className="text-lg font-semibold text-text-primary">Помилка інтерфейсу</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Схоже, сталася помилка у відображенні. Спробуйте перезавантажити сторінку або повернутися на головну.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => window.location.reload()}>
              Перезавантажити
            </Button>
            <Link href="/">
              <Button type="button" variant="secondary">
                На головну
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

