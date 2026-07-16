'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ImportPreview, ImportProgressEvent, ImportResult } from '@/lib/import/types'

type Mode = 'excel' | 'xml'
type Step = 'upload' | 'preview' | 'importing' | 'done'

type LiveProgress = {
  processed: number
  total: number
  created: number
  updated: number
  skipped: number
  message: string
}

async function readNdjsonImportStream(
  response: Response,
  onEvent: (event: ImportProgressEvent) => void
): Promise<ImportResult> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Помилка імпорту XML')
  }
  if (!response.body) {
    throw new Error('Порожня відповідь сервера.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalResult: ImportResult | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const event = JSON.parse(trimmed) as ImportProgressEvent
      onEvent(event)
      if (event.type === 'error') {
        throw new Error(event.error ?? 'Помилка імпорту')
      }
      if (event.type === 'done' && event.result) {
        finalResult = event.result
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer.trim()) as ImportProgressEvent
    onEvent(event)
    if (event.type === 'error') throw new Error(event.error ?? 'Помилка імпорту')
    if (event.type === 'done' && event.result) finalResult = event.result
  }

  if (!finalResult) {
    throw new Error('Імпорт завершився без підсумку. Оновіть сторінку товарів.')
  }
  return finalResult
}

export default function AdminImportProductsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('xml')
  const [feedUrl, setFeedUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState<LiveProgress | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function resetFlow() {
    setPreview(null)
    setResult(null)
    setProgress(null)
    setError('')
    setStep('upload')
  }

  function onModeChange(next: Mode) {
    setMode(next)
    setFile(null)
    resetFlow()
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    resetFlow()
  }

  async function handlePreview() {
    setLoading(true)
    setError('')
    try {
      if (mode === 'excel') {
        if (!file) {
          setError('Оберіть файл .xlsx')
          return
        }
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/admin/import-products/preview', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Помилка превʼю')
        setPreview(data as ImportPreview)
      } else {
        const url = feedUrl.trim()
        if (!url) {
          setError('Вставте посилання на XML')
          return
        }
        const response = await fetch('/api/admin/import-yml/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Помилка превʼю XML')
        setPreview(data as ImportPreview)
      }
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зробити превʼю')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    setLoading(true)
    setError('')
    setProgress(null)
    setStep('importing')
    try {
      let importResult: ImportResult

      if (mode === 'excel') {
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/admin/import-products', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Помилка імпорту')
        importResult = data as ImportResult
      } else {
        const url = feedUrl.trim()
        if (!url) return
        const response = await fetch('/api/admin/import-yml', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        importResult = await readNdjsonImportStream(response, event => {
          if (event.type === 'status') {
            setProgress(prev => ({
              processed: prev?.processed ?? 0,
              total: prev?.total ?? preview?.totalParsed ?? 0,
              created: prev?.created ?? 0,
              updated: prev?.updated ?? 0,
              skipped: prev?.skipped ?? 0,
              message: event.message ?? 'Імпорт…',
            }))
          }
          if (event.type === 'progress') {
            setProgress({
              processed: event.processed ?? 0,
              total: event.total ?? 0,
              created: event.created ?? 0,
              updated: event.updated ?? 0,
              skipped: event.skipped ?? 0,
              message: event.message ?? 'Імпорт…',
            })
          }
        })
      }

      setResult(importResult)
      setStep('done')
      void fetch('/api/admin/bootstrap', { method: 'POST' }).catch(() => {
        // Кеш каталогу оновлюється також на сервері після імпорту.
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося виконати імпорт')
      setStep(preview ? 'preview' : 'upload')
    } finally {
      setLoading(false)
    }
  }

  const canPreview = mode === 'xml' ? Boolean(feedUrl.trim()) : Boolean(file)
  const previewCategories = preview ? [...new Set(preview.categories)] : []
  const progressPercent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Назад до товарів
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-3">Імпорт товарів</h1>
        <p className="text-sm text-text-muted mt-1">
          XML — YML-фід за HTTPS-посиланням. Excel — таблиця дилера (.xlsx), листи стають
          категоріями.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <ModeTab active={mode === 'xml'} onClick={() => onModeChange('xml')} disabled={loading}>
          XML
        </ModeTab>
        <ModeTab active={mode === 'excel'} onClick={() => onModeChange('excel')} disabled={loading}>
          Excel
        </ModeTab>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
        {step !== 'importing' && step !== 'done' && (
          <>
            {mode === 'excel' ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} />
                    Обрати файл
                  </Button>
                  {file && (
                    <span className="text-sm text-text-secondary truncate">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(1)} МБ)
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Будь-який `.xlsx` з каталожними листами: назва листа → категорія. Листи на кшталт
                  «Зміни у прайсі» пропускаються. Ідентифікатор оновлення — «Код база» у specs.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm text-text-secondary">
                  Посилання на XML
                  <input
                    type="url"
                    value={feedUrl}
                    onChange={event => {
                      setFeedUrl(event.target.value)
                      resetFlow()
                    }}
                    placeholder="https://example.com/price.xml"
                    className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary"
                  />
                </label>
                <p className="text-xs text-text-muted">
                  Вставте HTTPS-посилання на `.xml` фід. Імпортуються товари з наявністю (stock &gt;
                  0). Ідентифікатор оновлення — offer id у specs «Offer ID». HTML в описі очищається
                  до тексту. Зображення зберігаються як URL з фіду.
                </p>
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {step === 'upload' && (
          <Button
            type="button"
            onClick={() => void handlePreview()}
            disabled={!canPreview || loading}
            className="inline-flex items-center gap-2"
          >
            <Upload size={16} />
            {loading
              ? mode === 'xml'
                ? 'Завантаження та аналіз XML…'
                : 'Аналіз файлу…'
              : mode === 'xml'
                ? 'Перевірити XML'
                : 'Перевірити файл'}
          </Button>
        )}

        {preview && step === 'preview' && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="До імпорту" value={preview.totalParsed} />
              <Stat label="Створити" value={preview.toCreate} />
              <Stat label="Оновити" value={preview.toUpdate} />
              <Stat label="Пропущено" value={preview.skipped} />
            </div>
            <p className="text-xs text-text-muted">
              Пропущено без наявності: {preview.skippedOutOfStock}, дублікатів коду:{' '}
              {preview.skippedDuplicateCode}.
              {mode === 'excel' && (
                <>
                  {' '}
                  Змін цін: {preview.priceChanges} (знайдено в каталозі: {preview.priceChangesMatched}
                  ).
                </>
              )}
            </p>
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">
                {mode === 'excel' ? 'Категорії (листи Excel)' : 'Категорії з фіду'}
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {previewCategories.slice(0, 40).map((name, index) => (
                  <span
                    key={`${name}::${index}`}
                    className="text-xs px-2 py-1 rounded bg-bg-elevated text-text-secondary"
                  >
                    {name}
                  </span>
                ))}
                {previewCategories.length > 40 && (
                  <span className="text-xs px-2 py-1 text-text-muted">
                    +{previewCategories.length - 40} ще
                  </span>
                )}
              </div>
            </div>
            {preview.sample.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-muted border-b border-border">
                      <th className="py-2 pr-3">{mode === 'xml' ? 'Offer ID' : 'Код'}</th>
                      <th className="py-2 pr-3">Назва</th>
                      <th className="py-2 pr-3">Категорія</th>
                      <th className="py-2 pr-3">Ціна</th>
                      <th className="py-2 pr-3">Залишок</th>
                      <th className="py-2 pr-3">Фото</th>
                      <th className="py-2">Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map(item => (
                      <tr key={item.dealerCode} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-mono text-xs">{item.dealerCode}</td>
                        <td className="py-2 pr-3 max-w-[200px] truncate">{item.name}</td>
                        <td className="py-2 pr-3">{item.sheet}</td>
                        <td className="py-2 pr-3">{item.price} ₴</td>
                        <td className="py-2 pr-3">{item.stock}</td>
                        <td className="py-2 pr-3">{item.imageCount}</td>
                        <td className="py-2">{item.action === 'create' ? 'Створити' : 'Оновити'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={loading}
              className="inline-flex items-center gap-2"
            >
              Підтвердити імпорт
            </Button>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-text-primary">
              {progress?.message ?? 'Імпорт у процесі…'}
            </p>
            <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">
              {progress
                ? `${progress.processed} / ${progress.total} · створено ${progress.created}, оновлено ${progress.updated}, пропущено ${progress.skipped}`
                : 'Не закривайте цю вкладку до завершення.'}
            </p>
          </div>
        )}

        {result && step === 'done' && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="text-sm font-medium text-text-primary">Імпорт завершено</p>
                <p className="text-xs text-text-muted mt-1">
                  Товари збережено в каталозі. Можете перейти до списку або запустити новий імпорт.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Stat label="Створено" value={result.created} />
              <Stat label="Оновлено" value={result.updated} />
              {mode === 'excel' && <Stat label="Цін оновлено" value={result.priceUpdates} />}
              <Stat
                label={mode === 'xml' ? 'Фото (URL)' : 'Фото завантажено'}
                value={result.imagesUploaded}
              />
              <Stat label="Помилок" value={result.errors.length} />
              {result.processed != null && <Stat label="Оброблено" value={result.processed} />}
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 20).map((msg, index) => (
                  <p key={index}>{msg}</p>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  router.refresh()
                  router.push('/admin/products?imported=1')
                }}
              >
                Перейти до товарів
              </Button>
              <Button type="button" variant="secondary" onClick={resetFlow}>
                Новий імпорт
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        active
          ? 'bg-accent text-white'
          : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-bg-elevated px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-lg font-semibold text-text-primary">{value}</p>
    </div>
  )
}
