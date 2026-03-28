'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface ProductReview {
  id: string
  user_id: string
  body: string
  created_at: string
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('uk-UA', { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
  } catch {
    return iso
  }
}

export default function ProductReviews({
  productId,
  initialReviews,
}: {
  productId: string
  initialReviews: ProductReview[]
}) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews)
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reviewsAvailable, setReviewsAvailable] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        setUserId(data.user?.id ?? null)
      } catch {
        if (!mounted) return
        setUserId(null)
      } finally {
        if (!mounted) return
        setLoadingUser(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [supabase])

  async function submit() {
    setError('')
    const trimmed = body.trim()
    if (!trimmed) return
    if (!reviewsAvailable) {
      setError('Відгуки тимчасово недоступні (таблиця ще не створена).')
      return
    }
    if (!userId) {
      setError('Увійдіть, щоб залишити відгук.')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({ product_id: productId, user_id: userId, body: trimmed })
        .select('id,user_id,body,created_at')
        .single()
      if (error || !data) {
        const msg = String((error as any)?.message ?? error ?? 'Не вдалося додати відгук.')
        if (msg.includes("Could not find the table 'public.product_reviews'")) {
          setReviewsAvailable(false)
          setError('Відгуки ще не увімкнені на сервері. Застосуйте міграцію БД для `product_reviews`.')
          return
        }
        setError(msg)
        return
      }
      setReviews(prev => [data as ProductReview, ...prev])
      setBody('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Залишити відгук</h3>
        {loadingUser ? (
          <p className="text-sm text-text-muted">Перевіряю авторизацію…</p>
        ) : userId ? (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Поділіться досвідом покупки або використання…"
              className={cn(
                'w-full rounded border border-border bg-bg-input px-3 py-2 text-sm text-text-primary',
                'placeholder:text-text-muted resize-y focus:outline-none focus:border-accent'
              )}
              disabled={!reviewsAvailable || saving}
            />
            {error && <p className="text-xs text-error mt-2">{error}</p>}
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                onClick={() => void submit()}
                disabled={!reviewsAvailable || !body.trim()}
                loading={saving}
              >
                Опублікувати
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-muted">
            Щоб залишити відгук, потрібно увійти в акаунт.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-surface p-6 text-sm text-text-muted">
            Відгуків поки немає — будьте першим.
          </div>
        ) : (
          reviews.map(r => (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-bg-surface p-5 shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">Користувач</p>
                <p className="text-xs text-text-muted">{formatDate(r.created_at)}</p>
              </div>
              <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap leading-relaxed break-words">
                {r.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

