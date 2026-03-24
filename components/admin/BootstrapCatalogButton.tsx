'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function BootstrapCatalogButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  async function handleBootstrap() {
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/admin/bootstrap', { method: 'POST' })
      const payload = await res.json() as {
        ok?: boolean
        stats?: {
          categories: number
          brands: number
          products: number
          car_makes: number
          car_models: number
        }
      }
      if (!res.ok || !payload.ok || !payload.stats) {
        setResult('Помилка синхронізації.')
        return
      }

      setResult(
        `Готово: ${payload.stats.categories} кат., ${payload.stats.brands} брендів, ${payload.stats.products} товарів, ${payload.stats.car_makes} марок, ${payload.stats.car_models} моделей.`
      )
    } catch {
      setResult('Помилка синхронізації.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleBootstrap}
        loading={loading}
      >
        Синхронізувати каталог в БД
      </Button>
      {result && <p className="text-xs text-text-muted">{result}</p>}
    </div>
  )
}
