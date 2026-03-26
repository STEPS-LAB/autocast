'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  editable?: boolean
  type?: 'text' | 'number' | 'select'
  min?: number
  options?: string[]
}

interface AdminTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  onUpdate?: (id: string, key: string, value: string | number) => void
  onDelete?: (id: string) => void
  renderActions?: (row: T) => React.ReactNode
  actionsAlwaysVisible?: boolean
  onAdd?: () => void
  addLabel?: string
  rowHref?: (row: T) => string
}

export default function AdminTable<T extends { id: string }>({
  data,
  columns,
  onUpdate,
  onDelete,
  renderActions,
  actionsAlwaysVisible = false,
  onAdd,
  addLabel = 'Додати',
  rowHref,
}: AdminTableProps<T>) {
  const router = useRouter()
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  function startEdit(id: string, key: string, currentValue: string) {
    setEditingCell({ id, key })
    setEditValue(currentValue)
  }

  function saveEdit() {
    if (!editingCell) return
    onUpdate?.(editingCell.id, editingCell.key, editValue)
    setEditingCell(null)
  }

  function cancelEdit() {
    setEditingCell(null)
  }

  function isInteractiveElement(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false
    return Boolean(target.closest('a,button,input,select,textarea,label,[role="button"],[role="link"]'))
  }

  function openRow(row: T) {
    const href = rowHref?.(row)
    if (!href) return
    router.push(href)
  }

  return (
    <div className="fade-up-in">
      {onAdd && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <Plus size={14} />
            {addLabel}
          </Button>
        </div>
      )}

      <div className="bg-bg-surface border border-border rounded-md overflow-hidden transition-shadow duration-300 hover:shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    className="text-left px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                {(onUpdate || onDelete) && (
                  <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-wider text-right">
                    Дії
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(row => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-bg-elevated transition-all duration-300 ease-out group',
                    rowHref && 'cursor-pointer'
                  )}
                  tabIndex={rowHref ? 0 : undefined}
                  role={rowHref ? 'link' : undefined}
                  onClick={(e) => {
                    if (!rowHref) return
                    if (isInteractiveElement(e.target)) return
                    openRow(row)
                  }}
                  onKeyDown={(e) => {
                    if (!rowHref) return
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    if (isInteractiveElement(e.target)) return
                    e.preventDefault()
                    openRow(row)
                  }}
                >
                  {columns.map(col => {
                    const isEditing =
                      editingCell?.id === row.id && editingCell?.key === String(col.key)
                    const rawVal = (row as Record<string, unknown>)[String(col.key)]
                    const cellValue = typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal ?? '')

                    return (
                      <td key={String(col.key)} className="px-4 py-3">
                        {col.render ? (
                          col.render(row)
                        ) : isEditing ? (
                          <div className="flex items-center gap-1">
                            {col.type === 'select' && col.options ? (
                              <select
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                autoFocus
                                className="w-44 h-7 bg-bg-elevated border border-accent rounded px-2 text-xs text-text-primary focus:outline-none"
                              >
                                {col.options.map(o => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type ?? 'text'}
                                min={col.type === 'number' ? col.min : undefined}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                                autoFocus
                                className={cn(
                                  'h-7 bg-bg-elevated border border-accent rounded px-2 text-xs text-text-primary focus:outline-none',
                                  col.type === 'number' ? 'w-16 text-center' : 'w-56'
                                )}
                              />
                            )}
                            <button onClick={saveEdit} className="p-1 text-success hover:bg-success/10 rounded transition-colors">
                              <Check size={12} />
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-error hover:bg-error/10 rounded transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/cell">
                            <span className="text-sm text-text-primary">{cellValue}</span>
                            {col.editable && onUpdate && (
                              <button
                                onClick={() => startEdit(row.id, String(col.key), cellValue)}
                                className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-accent transition-all rounded"
                              >
                                <Pencil size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}

                  {(onUpdate || onDelete) && (
                    <td className="px-4 py-3">
                      <div className={cn(
                        'flex items-center justify-end gap-1 transition-opacity',
                        actionsAlwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}>
                        {renderActions?.(row)}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row.id)}
                            className={cn(
                              'p-1.5 rounded text-text-muted hover:text-error',
                              'hover:bg-error/10 transition-colors'
                            )}
                            aria-label="Видалити"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center text-sm text-text-muted"
                  >
                    Немає даних
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
