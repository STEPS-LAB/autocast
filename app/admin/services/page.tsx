'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { LayoutGroup, motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'

type ServiceRow = Service & {
  id: string
  sort_order?: number
  is_active?: boolean
}

export default function AdminServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  async function getSupabase() {
    const mod = await import('@/lib/supabase/client')
    return mod.createClient()
  }

  useEffect(() => {
    let isMounted = true
    async function loadServices() {
      const supabase = await getSupabase()
      const { data } = await supabase
        .from('services')
        .select('id,slug,name_ua,description_ua,image_url,created_at,updated_at,sort_order,is_active')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (!isMounted) return
      setServices((data as ServiceRow[]) ?? [])
      setLoading(false)
    }
    void loadServices()
    return () => {
      isMounted = false
    }
  }, [])

  async function confirmDelete() {
    if (!deleteServiceId) return
    setDeleteError('')
    const supabase = await getSupabase()
    const { error } = await supabase.from('services').delete().eq('id', deleteServiceId)
    if (error) {
      setDeleteError(error.message || 'Не вдалося видалити послугу.')
      return
    }
    setServices(prev => prev.filter(item => item.id !== deleteServiceId))
    setDeleteServiceId(null)
  }

  async function reorderServices(sourceId: string, targetId: string) {
    if (sourceId === targetId) return
    const sourceIndex = services.findIndex(s => s.id === sourceId)
    const targetIndex = services.findIndex(s => s.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const reordered = [...services]
    const [moved] = reordered.splice(sourceIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)
    const normalized = reordered.map((item, index) => ({ ...item, sort_order: index + 1 }))
    setServices(normalized)

    const supabase = await getSupabase()
    await Promise.all(
      normalized.map(item =>
        supabase.from('services').update({ sort_order: item.sort_order ?? 0 }).eq('id', item.id)
      )
    )
  }

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return services
    return services.filter(service =>
      service.name_ua.toLowerCase().includes(query)
      || service.description_ua.toLowerCase().includes(query)
    )
  }, [searchQuery, services])

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Послуги</h1>
          <p className="text-sm text-text-muted">{filteredServices.length} послуг</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="services-search">Пошук послуг</label>
          <input
            id="services-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук послуг..."
            className="h-9 w-64 rounded border border-border bg-bg-input px-3 text-sm text-text-primary transition-all duration-300 focus:border-border-light"
          />
          <Link
            href="/admin/services/new"
            className={cn(
              'inline-flex items-center justify-center font-medium rounded transition-all duration-150',
              'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
              'bg-accent text-text-primary hover:bg-accent-hover active:scale-[0.98] shadow-sm',
              'h-8 px-3 text-sm gap-1.5 shrink-0'
            )}
          >
            <Plus size={14} />
            Додати послугу
          </Link>
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-md overflow-hidden transition-shadow duration-300 hover:shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">Фото</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">Назва</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">Опис</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">Статус</th>
                <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider text-right">Дії</th>
              </tr>
            </thead>
            <LayoutGroup>
              <tbody className="divide-y divide-border">
                {filteredServices.map(service => (
                  <motion.tr
                    key={service.id}
                    layout
                    transition={{ type: 'spring', stiffness: 450, damping: 36, mass: 0.8 }}
                    draggable={!searchQuery}
                    onDragStart={() => setDraggingId(service.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggingId) return
                      void reorderServices(draggingId, service.id)
                      setDraggingId(null)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={cn(
                      'hover:bg-bg-elevated transition-all duration-300 ease-out',
                      !searchQuery && 'cursor-grab active:cursor-grabbing'
                    )}
                  >
                  <td className="px-4 py-3">
                    {service.image_url ? (
                      <div className="relative size-12 overflow-hidden rounded border border-border bg-bg-elevated">
                        <Image src={service.image_url} alt={service.name_ua} fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="size-12 rounded border border-border bg-bg-elevated" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary">{service.name_ua}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-secondary line-clamp-3 max-w-[420px]">{service.description_ua}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {service.is_active === false ? 'Приховано' : 'Активна'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/services/${encodeURIComponent(service.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        aria-label="Відкрити послугу на сайті"
                        title="Відкрити на сайті"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button
                        onClick={() => router.push(`/admin/services/${encodeURIComponent(service.id)}`)}
                        className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        aria-label="Редагувати послугу"
                        title="Редагувати послугу"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteServiceId(service.id)}
                        className="p-1.5 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                        aria-label="Видалити послугу"
                        title="Видалити послугу"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  </motion.tr>
                ))}
                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-text-muted">
                      Немає послуг
                    </td>
                  </tr>
                )}
              </tbody>
            </LayoutGroup>
          </table>
        </div>
      </div>
      {!!searchQuery && (
        <p className="mt-2 text-xs text-text-muted">
          Перетягування вимкнене під час пошуку. Очистіть поле пошуку для зміни порядку.
        </p>
      )}

      {loading && <p className="text-sm text-text-muted mt-3">Завантаження...</p>}

      <Modal
        open={!!deleteServiceId}
        onClose={() => {
          setDeleteServiceId(null)
          setDeleteError('')
        }}
        title="Видалити послугу?"
        description="Цю дію неможливо скасувати."
        size="sm"
      >
        <div className="space-y-3">
          {deleteError && <p className="text-xs text-error">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteServiceId(null)}>
              Скасувати
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
