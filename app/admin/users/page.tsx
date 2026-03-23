'use client'

import { useState } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import Badge from '@/components/ui/Badge'
import type { Column } from '@/components/admin/AdminTable'
import { formatDate } from '@/lib/utils'

interface DemoUser {
  id: string
  email: string
  role: string
  orders: number
  joined: string
}

const DEMO_USERS: DemoUser[] = [
  { id: 'u-001', email: 'admin@autocast.com.ua', role: 'admin', orders: 0, joined: '2024-01-01' },
  { id: 'u-002', email: 'ivan@example.com', role: 'user', orders: 2, joined: '2024-03-15' },
  { id: 'u-003', email: 'maria@example.com', role: 'user', orders: 1, joined: '2024-05-20' },
  { id: 'u-004', email: 'oleg@example.com', role: 'user', orders: 3, joined: '2024-06-10' },
  { id: 'u-005', email: 'natalia@example.com', role: 'user', orders: 1, joined: '2024-08-05' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState(DEMO_USERS)

  function handleUpdate(id: string, key: string, value: string | number) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [key]: value } : u))
  }

  const columns: Column<DemoUser>[] = [
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
    </div>
  )
}
