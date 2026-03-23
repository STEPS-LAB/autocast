import Link from 'next/link'
import { Zap, Phone, Mail, MapPin } from 'lucide-react'

const SHOP_LINKS = [
  { href: '/shop/avtozvuk', label: 'Автозвук' },
  { href: '/shop/avtosvitlo', label: 'Автосвітло' },
  { href: '/shop/avtoelektronika', label: 'Автоелектроніка' },
  { href: '/shop/zakhyst-vid-uhonu', label: 'Захист від угону' },
]

const INFO_LINKS = [
  { href: '/about', label: 'Про нас' },
  { href: '/contact', label: 'Контакти' },
  { href: '/account', label: 'Мій акаунт' },
]

export default function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-border mt-auto">
      <div className="container-xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center size-8 bg-accent rounded text-white">
                <Zap size={16} strokeWidth={2.5} />
              </span>
              <span className="font-bold text-lg tracking-tight text-text-primary">
                AUTO<span className="text-accent">CAST</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              Преміальні автозапчастини та електроніка. Якість, яка говорить сама за себе.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Каталог
            </h4>
            <ul className="flex flex-col gap-2.5">
              {SHOP_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Інформація
            </h4>
            <ul className="flex flex-col gap-2.5">
              {INFO_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Контакти
            </h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Phone size={15} className="text-accent shrink-0" />
                <a href="tel:+380672391640" className="hover:text-text-primary transition-colors">
                  +38 067 239 1640
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Mail size={15} className="text-accent shrink-0" />
                <a href="mailto:info@autocast.com.ua" className="hover:text-text-primary transition-colors">
                  info@autocast.com.ua
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-text-secondary">
                <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
                <span>Україна, Київ</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-xl py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Autocast. Усі права захищено.
          </p>
          <p className="text-xs text-text-muted">
            Розроблено з увагою до деталей
          </p>
        </div>
      </div>
    </footer>
  )
}
