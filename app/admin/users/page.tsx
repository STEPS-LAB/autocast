'use client'

import { useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import Badge from '@/components/ui/Badge'
import type { Column } from '@/components/admin/AdminTable'
import { formatDate } from '@/lib/utils'
import { useEffect } from 'react'

interface AdminUser {
  id: string
  email: string
  role: string
  orders: number
  joined: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadUsers() {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!res.ok) {
        if (isMounted) setLoading(false)
        return
      }
      const payload = await res.json() as { users: AdminUser[] }
      if (!isMounted) return
      setUsers(payload.users ?? [])
      setLoading(false)
    }

    void loadUsers()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleUpdate(id: string, key: string, value: string | number) {
    if (key !== 'role') return
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: value }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [key]: value } : u))
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-sm text-text-primary">{row.email}</span>,
    },
    {
      key: 'role',
      label: 'Роль',
      editable: true,
      type: 'select',
      options: ['user', 'admin'],
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'accent' : 'muted'}>
          {row.role === 'admin' ? 'Адмін' : 'Клієнт'}
        </Badge>
      ),
    },
    {
      key: 'orders',
      label: 'Замовлення',
      render: (row) => <span className="text-sm text-text-secondary">{row.orders}</span>,
    },
    {
      key: 'joined',
      label: 'Реєстрація',
      render: (row) => <span className="text-xs text-text-muted">{formatDate(row.joined)}</span>,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Користувачі</h1>
        <p className="text-sm text-text-muted">{users.length} користувачів</p>
      </div>
      <AdminTable
        data={users}
        columns={columns}
        onUpdate={handleUpdate}
      />
      {loading && <p className="text-sm text-text-muted mt-3">Завантаження...</p>}
    </div>
  )
}
