import type { Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import AppLayoutClient from '@/components/layout/AppLayoutClient'
import RootClientBoundary from '@/components/error/RootClientBoundary'
import { buildRootMetadata } from '@/lib/seo/metadata'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = buildRootMetadata()

export const viewport: Viewport = {
  themeColor: '#09090B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="uk"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <RootClientBoundary>
          <AppLayoutClient>{children}</AppLayoutClient>
        </RootClientBoundary>
      </body>
    </html>
  )
}
