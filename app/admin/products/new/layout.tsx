import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Новий товар' }

export default function NewProductLayout({ children }: { children: React.ReactNode }) {
  return children
}
