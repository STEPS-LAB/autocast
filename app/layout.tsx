import type { Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import AppLayoutClient from '@/components/layout/AppLayoutClient'
import RootClientBoundary from '@/components/error/RootClientBoundary'
import { buildRootMetadata } from '@/lib/seo/metadata'
import { CRITICAL_CSS, DEFER_STYLES_BOOTSTRAP } from '@/lib/critical-css'

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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: DEFER_STYLES_BOOTSTRAP }} />
        <style id="critical-css" dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <RootClientBoundary>
          <AppLayoutClient>{children}</AppLayoutClient>
        </RootClientBoundary>
      </body>
    </html>
  )
}
