import Link from 'next/link'
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react'
import SiteLogo from '@/components/layout/SiteLogo'

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
    <footer className="mt-auto bg-zinc-900 border-t border-zinc-700/80 text-zinc-100">
      <div className="container-xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <SiteLogo variant="footer" className="mb-4" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Преміальні автозапчастини та електроніка. Якість, яка говорить сама за себе.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 mb-4 uppercase tracking-wider">
              Каталог
            </h4>
            <ul className="flex flex-col gap-2.5">
              {SHOP_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 mb-4 uppercase tracking-wider">
              Інформація
            </h4>
            <ul className="flex flex-col gap-2.5">
              {INFO_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 mb-4 uppercase tracking-wider">
              Контакти
            </h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2.5 text-sm text-zinc-300">
                <Phone size={15} className="text-accent shrink-0" />
                <a href="tel:+380672391640" className="hover:text-white transition-colors">
                  +38 067 239 1640
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-zinc-300">
                <Mail size={15} className="text-accent shrink-0" />
                <a href="mailto:autocast.com.ua@gmail.com" className="hover:text-white transition-colors">
                  autocast.com.ua@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-300">
                <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
                <span>м. Житомир, вулиця Вітрука, 12в</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://www.instagram.com/autocast.com.ua/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
              >
                <Instagram size={15} className="text-accent" />
                Instagram
              </a>
              <a
                href="https://autocast.com.ua/about-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
              >
                <Facebook size={15} className="text-accent" />
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="container-xl py-5 grid grid-cols-1 md:grid-cols-3 items-center gap-2">
          <p className="text-xs text-zinc-400 text-center md:text-left">
            © {new Date().getFullYear()} Autocast. Усі права захищено.
          </p>
          <p className="text-xs text-zinc-400 text-center">
            Developed by{' '}
            <a
              href="https://stepslab.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              STEPS LAB
            </a>
          </p>
          <div className="hidden md:block" />
        </div>
      </div>
    </footer>
  )
}
