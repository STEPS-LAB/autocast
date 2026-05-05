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
  content?: Record<string, unknown>
}

interface ServiceFormState {
  name_ua: string
  description_ua: string
  image_url: string
  is_active: boolean
}

const EMPTY_FORM: ServiceFormState = {
  name_ua: '',
  description_ua: '',
  image_url: '',
  is_active: true,
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

  function buildSeoDescription(source: string) {
    const normalized = source.replace(/\s+/g, ' ').trim()
    if (!normalized) return ''
    return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized
  }

  function buildContentFromForm(description: string) {
    return {
      metaDescription: buildSeoDescription(description),
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
      setForm({
        name_ua: row.name_ua,
        description_ua: row.description_ua,
        image_url: row.image_url ?? '',
        is_active: row.is_active !== false,
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
      const slug = await ensureUniqueSlug(name, serviceId)
      const imageUrl = await uploadImageIfNeeded()
      const content = buildContentFromForm(description)
      const { error } = await supabase
        .from('services')
        .update({
          slug,
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
          <p className="text-sm text-text-muted">Slug генерується автоматично з назви.</p>
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
