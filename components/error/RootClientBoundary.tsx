'use client'

import ClientErrorBoundary from '@/components/error/ClientErrorBoundary'

export default function RootClientBoundary({ children }: { children: React.ReactNode }) {
  return <ClientErrorBoundary>{children}</ClientErrorBoundary>
}

