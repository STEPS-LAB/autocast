'use client'

import { type ChangeEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import type { Service } from '@/types'
import { generateId, slugify } from '@/lib/utils'

type ServiceRow = Service & {
  id: string
  sort_order?: number
  is_active?: boolean
  content?: Record<string, unknown> | string | null
}

interface ServiceFormState {
  slug: string
  name_ua: string
  description_ua: string
  image_url: string
  is_active: boolean
  whatIncluded: string[]
  howSteps: Array<{ text: string }>
  whyIntro: string
  faqs: Array<{ q: string; a: string }>
}

const EMPTY_FORM: ServiceFormState = {
  slug: '',
  name_ua: '',
  description_ua: '',
  image_url: '',
  is_active: true,
  whatIncluded: [],
  howSteps: [],
  whyIntro: '',
  faqs: [],
}

export default function AdminServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [serviceId, setServiceId] = useState('')
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')

  async function getSupabase() {
    const mod = await import('@/lib/supabase/client')
    return mod.createClient()
  }

  function asContentObject(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
      } catch {
        return {}
      }
    }
    return {}
  }

  function buildSeoDescription(source: string) {
    const normalized = source.replace(/\s+/g, ' ').trim()
    if (!normalized) return ''
    return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized
  }

  function buildContentFromForm(description: string) {
    const whatIncluded = form.whatIncluded
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => ({ text, icon: 'sparkles' }))
    const howSteps = form.howSteps
      .map((step) => ({ text: step.text.trim() }))
      .filter((step) => step.text)
    const whyIntro = form.whyIntro.trim()
    const faqs = form.faqs
      .map((faq) => ({ q: faq.q.trim(), a: faq.a.trim() }))
      .filter((faq) => faq.q && faq.a)

    return {
      metaDescription: buildSeoDescription(description),
      whatIncluded,
      howSteps,
      whyIntro,
      faqs,
    }
  }

  useEffect(() => {
    let isMounted = true
    async function init() {
      const resolved = await params
      if (!isMounted) return
      setServiceId(resolved.id)
      const supabase = await getSupabase()
      const { data } = await supabase
        .from('services')
        .select('id,slug,name_ua,description_ua,image_url,created_at,updated_at,sort_order,is_active,content')
        .eq('id', resolved.id)
        .maybeSingle()
      if (!isMounted || !data) return
      const row = data as ServiceRow
      const content = asContentObject(row.content)
      const whatIncluded = Array.isArray(content.whatIncluded)
        ? content.whatIncluded
            .map((item) => {
              if (typeof item === 'string') {
                const raw = item.trim()
                if (!raw) return null
                if (raw.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(raw) as Record<string, unknown>
                    return typeof parsed.text === 'string' ? parsed.text : null
                  } catch {
                    return raw
                  }
                }
                return raw
              }
              if (!item || typeof item !== 'object') return null
              const source = item as Record<string, unknown>
              return typeof source.text === 'string' ? source.text : null
            })
            .filter((item): item is string => item !== null)
        : []
      const howSteps = Array.isArray(content.howSteps)
        ? content.howSteps
            .map((item) => {
              if (typeof item === 'string') {
                const raw = item.trim()
                if (!raw) return null
                if (raw.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(raw) as Record<string, unknown>
                    const parsedText = typeof parsed.text === 'string'
                      ? parsed.text
                      : (typeof parsed.title === 'string' ? parsed.title : '')
                    return parsedText ? { text: parsedText } : null
                  } catch {
                    return { text: raw }
                  }
                }
                return { text: raw }
              }
              if (!item || typeof item !== 'object') return null
              const source = item as Record<string, unknown>
              const text = typeof source.text === 'string'
                ? source.text
                : (typeof source.title === 'string' ? source.title : '')
              if (!text) return null
              return { text }
            })
            .filter((item): item is { text: string } => item !== null)
        : []
      const whyIntro = typeof content.whyIntro === 'string'
        ? content.whyIntro
        : (
            Array.isArray(content.whyMatters)
              ? content.whyMatters.filter((item): item is string => typeof item === 'string').join('\n')
              : ''
          )
      const faqs = Array.isArray(content.faqs)
        ? content.faqs
            .map((item) => {
              if (!item || typeof item !== 'object') return null
              const source = item as Record<string, unknown>
              const q = typeof source.q === 'string' ? source.q : ''
              const a = typeof source.a === 'string' ? source.a : ''
              if (!q && !a) return null
              return { q, a }
            })
            .filter((item): item is { q: string; a: string } => item !== null)
        : []
      setForm({
        slug: row.slug,
        name_ua: row.name_ua,
        description_ua: row.description_ua,
        image_url: row.image_url ?? '',
        is_active: row.is_active !== false,
        whatIncluded,
        howSteps,
        whyIntro,
        faqs,
      })
      setLoading(false)
    }
    void init()
    return () => { isMounted = false }
  }, [params])

  async function ensureUniqueSlug(baseName: string, currentId: string) {
    const supabase = await getSupabase()
    const base = slugify(baseName) || `service-${generateId()}`
    let candidate = base
    let idx = 1
    while (idx < 100) {
      const { data } = await supabase.from('services').select('id').eq('slug', candidate).maybeSingle()
      if (!data || data.id === currentId) return candidate
      idx += 1
      candidate = `${base}-${idx}`
    }
    return `${base}-${generateId().slice(0, 6)}`
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageDataUrl) return form.image_url.trim() || null
    const uploadResponse = await fetch('/api/admin/upload-service-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, dataUrl: imageDataUrl }),
    })
    const uploadResult = (await uploadResponse.json()) as { publicUrl?: string; error?: string }
    if (!uploadResponse.ok || !uploadResult.publicUrl) throw new Error(uploadResult.error ?? 'Не вдалося завантажити зображення.')
    return uploadResult.publicUrl
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setFormError('Оберіть файл зображення.')
    setSelectedFileName(file.name)
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('read')))
      reader.onerror = () => reject(new Error('read'))
      reader.readAsDataURL(file)
    })
    setImageDataUrl(dataUrl)
    setFormError('')
  }

  async function handleSave() {
    const name = form.name_ua.trim()
    const description = form.description_ua.trim()
    if (!name || !description) return setFormError('Вкажіть назву та опис послуги.')
    setSaving(true)
    setFormError('')
    try {
      const supabase = await getSupabase()
      const imageUrl = await uploadImageIfNeeded()
      const content = buildContentFromForm(description)
      const { error } = await supabase
        .from('services')
        .update({
          slug: form.slug,
          name_ua: name,
          description_ua: description,
          image_url: imageUrl,
          is_active: form.is_active,
          content,
        })
        .eq('id', serviceId)
      if (error) throw error
      router.push('/admin/services')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Не вдалося зберегти послугу.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Редагувати послугу</h1>
        </div>
        <Link href="/admin/services" className="text-sm text-text-secondary hover:text-text-primary">← До списку послуг</Link>
      </div>
      {loading ? (
        <p className="text-sm text-text-muted">Завантаження...</p>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-text-muted">Зображення</span>
            <div className="mt-1 h-10 w-full rounded border border-border bg-bg-elevated px-2 flex items-center gap-2">
              <label htmlFor="service-image-upload" className="inline-flex h-7 items-center rounded border border-border px-2.5 text-xs text-text-primary bg-bg-surface hover:bg-bg-primary cursor-pointer shrink-0">Вибрати файл</label>
              <span className="text-sm text-text-secondary truncate">{selectedFileName || (form.image_url ? 'Поточне зображення збережено' : 'Файл не вибрано')}</span>
              <input id="service-image-upload" type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
            </div>
            {(imageDataUrl || form.image_url) && (
              <div className="mt-2 relative size-14 rounded overflow-hidden border border-border bg-bg-elevated">
                <Image
                  src={imageDataUrl || form.image_url}
                  alt="Превʼю зображення послуги"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
          </label>
          <label className="block"><span className="text-xs text-text-muted">Назва</span><input type="text" value={form.name_ua} onChange={(e) => setForm(prev => ({ ...prev, name_ua: e.target.value }))} className="mt-1 w-full h-10 rounded border border-border bg-bg-elevated px-3 text-sm text-text-primary" /></label>
          <label className="block"><span className="text-xs text-text-muted">Опис</span><textarea value={form.description_ua} onChange={(e) => setForm(prev => ({ ...prev, description_ua: e.target.value }))} className="mt-1 w-full min-h-24 rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary resize-y" /></label>
          <section className="space-y-2 rounded border border-border bg-bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">Що входить у роботу</h2>
              <Button onClick={() => setForm(prev => ({ ...prev, whatIncluded: [...prev.whatIncluded, ''] }))}>
                + Додати картку
              </Button>
            </div>
            {form.whatIncluded.length === 0 ? (
              <p className="text-xs text-text-muted">Карток ще немає.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {form.whatIncluded.map((item, index) => (
                  <div key={`what-included-${index}`} className="rounded border border-border bg-bg-elevated p-2 space-y-2">
                    <textarea
                      placeholder="Текст картки"
                      value={item}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        whatIncluded: prev.whatIncluded.map((entry, itemIndex) => (itemIndex === index ? e.target.value : entry)),
                      }))}
                      className="w-full min-h-20 rounded border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary resize-y"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          whatIncluded: prev.whatIncluded.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                      >
                        Видалити
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="space-y-2 rounded border border-border bg-bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">Як ми працюємо</h2>
              <Button onClick={() => setForm(prev => ({ ...prev, howSteps: [...prev.howSteps, { text: '' }] }))}>
                + Додати картку
              </Button>
            </div>
            {form.howSteps.length === 0 ? (
              <p className="text-xs text-text-muted">Карток ще немає.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {form.howSteps.map((step, index) => (
                  <div key={`how-step-${index}`} className="rounded border border-border bg-bg-elevated p-2 space-y-2">
                    <textarea
                      placeholder="Текст"
                      value={step.text}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        howSteps: prev.howSteps.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, text: e.target.value } : item
                        ),
                      }))}
                      className="w-full min-h-20 rounded border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary resize-y"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          howSteps: prev.howSteps.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                      >
                        Видалити
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="space-y-2 rounded border border-border bg-bg-surface p-3">
            <h2 className="text-sm font-semibold text-text-primary">Чому це важливо</h2>
            <textarea
              placeholder="Введіть ваш текст.."
              value={form.whyIntro}
              onChange={(e) => setForm(prev => ({ ...prev, whyIntro: e.target.value }))}
              className="w-full min-h-28 rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary resize-y"
            />
          </section>
          <section className="space-y-2 rounded border border-border bg-bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">Часті запитання</h2>
              <Button onClick={() => setForm(prev => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }))}>
                + Додати картку
              </Button>
            </div>
            {form.faqs.length === 0 ? (
              <p className="text-xs text-text-muted">Карток ще немає.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {form.faqs.map((faq, index) => (
                  <div key={`faq-${index}`} className="rounded border border-border bg-bg-elevated p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Питання"
                      value={faq.q}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        faqs: prev.faqs.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, q: e.target.value } : item
                        ),
                      }))}
                      className="w-full h-9 rounded border border-border bg-bg-surface px-3 text-sm text-text-primary"
                    />
                    <textarea
                      placeholder="Відповідь"
                      value={faq.a}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        faqs: prev.faqs.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, a: e.target.value } : item
                        ),
                      }))}
                      className="w-full min-h-20 rounded border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary resize-y"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          faqs: prev.faqs.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                      >
                        Видалити
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <label className="flex items-center gap-2"><input className="size-4 accent-accent" type="checkbox" checked={form.is_active} onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))} /><span className="text-sm text-text-primary">Активна (показувати на сайті)</span></label>
          {formError && <p className="text-xs text-error">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Link href="/admin/services"><Button variant="secondary">Скасувати</Button></Link>
            <Button onClick={handleSave} loading={saving}>Зберегти</Button>
          </div>
        </div>
      )}
    </div>
  )
}
