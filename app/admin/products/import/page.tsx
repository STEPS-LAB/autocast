'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileSpreadsheet, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { ImportPreview, ImportResult } from '@/lib/import/drivex/types'

type Step = 'upload' | 'preview' | 'done'

export default function AdminImportProductsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setPreview(null)
    setResult(null)
    setError('')
    setStep('upload')
  }

  async function handlePreview() {
    if (!file) {
      setError('Оберіть файл .xlsx')
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/import-products/preview', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Помилка превʼю')
      setPreview(data as ImportPreview)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зробити превʼю')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/import-products', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Помилка імпорту')
      setResult(data as ImportResult)
      setStep('done')
      try {
        await fetch('/api/admin/bootstrap', { method: 'POST' })
      } catch {
        // Кеш каталогу оновлюється також на сервері після імпорту.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося виконати імпорт')
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-text-primary mt-3">Імпорт прайсу DriveX</h1>
        <p className="text-sm text-text-muted mt-1">
          Завантажте Excel-прайс дилера. Імпортуються 7 каталожних листів, ціни оновлюються з «Зміни у прайсі».
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
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

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {step === 'upload' && (
          <Button
            type="button"
            onClick={() => void handlePreview()}
            disabled={!file || loading}
            className="inline-flex items-center gap-2"
          >
            <Upload size={16} />
            {loading ? 'Аналіз файлу…' : 'Перевірити файл'}
          </Button>
        )}

        {preview && step !== 'upload' && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="До імпорту" value={preview.totalParsed} />
              <Stat label="Створити" value={preview.toCreate} />
              <Stat label="Оновити" value={preview.toUpdate} />
              <Stat label="Пропущено" value={preview.skipped} />
            </div>
            <p className="text-xs text-text-muted">
              Пропущено без наявності: {preview.skippedOutOfStock}, дублікатів коду: {preview.skippedDuplicateCode}.
              Змін цін: {preview.priceChanges} (знайдено в каталозі: {preview.priceChangesMatched}).
            </p>
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Категорії (листи Excel)</p>
              <div className="flex flex-wrap gap-2">
                {preview.categories.map(name => (
                  <span key={name} className="text-xs px-2 py-1 rounded bg-bg-elevated text-text-secondary">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            {preview.sample.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-muted border-b border-border">
                      <th className="py-2 pr-3">Код</th>
                      <th className="py-2 pr-3">Назва</th>
                      <th className="py-2 pr-3">Лист</th>
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
            {step === 'preview' && (
              <Button
                type="button"
                onClick={() => void handleImport()}
                disabled={loading}
                className="inline-flex items-center gap-2"
              >
                {loading ? 'Імпорт… (може зайняти кілька хвилин)' : 'Підтвердити імпорт'}
              </Button>
            )}
          </div>
        )}

        {result && step === 'done' && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-text-primary">Імпорт завершено</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Stat label="Створено" value={result.created} />
              <Stat label="Оновлено" value={result.updated} />
              <Stat label="Цін оновлено" value={result.priceUpdates} />
              <Stat label="Фото завантажено" value={result.imagesUploaded} />
              <Stat label="Помилок" value={result.errors.length} />
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 20).map((msg, index) => (
                  <p key={index}>{msg}</p>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                router.refresh()
                router.push('/admin/products?imported=1')
              }}
              className="inline-block text-sm text-accent hover:underline"
            >
              Перейти до товарів →
            </button>
          </div>
        )}
      </div>
    </div>
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
