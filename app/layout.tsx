import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MobileNav from '@/components/layout/MobileNav'
import CartDrawer from '@/components/cart/CartDrawer'
import AIAssistant from '@/components/ai/AIAssistant'

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
    <html lang="uk" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
        <div
          className="md:hidden h-[calc(72px+env(safe-area-inset-bottom))] bg-zinc-900"
          aria-hidden="true"
        />
        <MobileNav />
        <CartDrawer />
        <AIAssistant />
      </body>
    </html>
  )
}
