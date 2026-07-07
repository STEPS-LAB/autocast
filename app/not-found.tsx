import Link from 'next/link'
import Button from '@/components/ui/Button'
import { linkTitleHome, linkTitleShop } from '@/lib/seo/accessibility'

export default function NotFound() {
  return (
    <div className="container-xl py-24">
      <div className="max-w-xl mx-auto bg-bg-surface border border-border rounded-md p-6">
        <h1 className="text-xl font-semibold text-text-primary">Сторінку не знайдено</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Можливо, посилання застаріло або сторінку було видалено.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/" title={linkTitleHome()}>
            <Button type="button">На головну</Button>
          </Link>
          <Link href="/shop" title={linkTitleShop()}>
            <Button type="button" variant="secondary">В магазин</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

