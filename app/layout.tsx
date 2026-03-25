import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import AppLayoutClient from '@/components/layout/AppLayoutClient'

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

export const metadata: Metadata = {
  title: {
    default: 'Autocast — Преміальні автозапчастини',
    template: '%s | Autocast',
  },
  description:
    'Autocast — інтернет-магазин преміальних автозапчастин та електроніки. Автозвук, автосвітло, навігація, захист від угону. Доставка по всій Україні.',
  keywords: [
    'автозапчастини', 'автомагнітола', 'GPS навігатор', 'відеореєстратор',
    'LED лампи', 'автосигналізація', 'автозвук', 'автоелектроніка',
  ],
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: process.env['NEXT_PUBLIC_SITE_URL'],
    siteName: 'Autocast',
    title: 'Autocast — Преміальні автозапчастини',
    description: 'Інтернет-магазин преміальної авто електроніки та запчастин',
  },
  robots: { index: true, follow: true },
  themeColor: '#09090B',
}

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
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  )
}
