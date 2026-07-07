import { safeText } from '@/lib/seo/fallbacks'
import { SITE_NAME } from '@/lib/seo/site'

// ── Link titles ─────────────────────────────────────────────────────────────

export function linkTitleHome(): string {
  return 'На головну сторінку Autocast'
}

export function linkTitleShop(): string {
  return 'Перейти до каталогу автоелектроніки Autocast'
}

export function linkTitleServices(): string {
  return 'Переглянути послуги автосервісу Autocast у Житомирі'
}

export function linkTitleService(serviceName: string): string {
  const name = safeText(serviceName, 'послугу')
  return `Детальніше про ${name.toLowerCase()} у Житомирі`
}

export function linkTitleProduct(productName: string): string {
  const name = safeText(productName, 'товар')
  return `${name} — фото, характеристики та ціна`
}

export function linkTitleCategory(categoryName: string): string {
  const name = safeText(categoryName, 'категорію')
  return `Перейти до каталогу «${name}»`
}

export function linkTitleAbout(): string {
  return 'Дізнатися більше про Autocast у Житомирі'
}

export function linkTitleContact(): string {
  return 'Контакти Autocast у Житомирі — адреса та телефони'
}

export function linkTitleAccount(): string {
  return 'Мій акаунт Autocast'
}

export function linkTitleCart(): string {
  return 'Перейти до кошика'
}

export function linkTitleCheckout(): string {
  return 'Оформити замовлення в Autocast'
}

export function linkTitlePhone(displayPhone: string): string {
  return `Зателефонувати до Autocast: ${displayPhone}`
}

export function linkTitleEmail(): string {
  return `Написати на email ${SITE_NAME}`
}

export function linkTitleAddress(): string {
  return 'Відкрити адресу Autocast на карті — Житомир, вул. Вітрука 12в'
}

export function linkTitleInstagram(): string {
  return 'Autocast в Instagram'
}

export function linkTitleFacebook(): string {
  return 'Autocast на Facebook'
}

export function linkTitleNav(label: string): string {
  const titles: Record<string, string> = {
    Головна: linkTitleHome(),
    Магазин: linkTitleShop(),
    Послуги: linkTitleServices(),
    'Про нас': linkTitleAbout(),
    Контакти: linkTitleContact(),
    Акаунт: linkTitleAccount(),
  }
  return titles[label] ?? `Перейти до розділу «${label}»`
}

export function linkTitleBreadcrumb(label: string): string {
  if (label === 'Головна') return linkTitleHome()
  if (label === 'Магазин') return linkTitleShop()
  if (label === 'Послуги') return linkTitleServices()
  if (label === 'Контакти') return linkTitleContact()
  return `Перейти до «${label}»`
}

export function linkTitleAllCategories(): string {
  return 'Переглянути всі категорії товарів'
}

export function linkTitleAllProducts(): string {
  return 'Переглянути весь каталог товарів'
}

export function linkTitleAllServices(): string {
  return 'Переглянути всі послуги майстерні Autocast'
}

export function linkTitleHeroServices(): string {
  return 'Переглянути послуги автосервісу в Житомирі'
}

export function linkTitleHeroShop(): string {
  return 'Знайти автозапчастини та електроніку в магазині'
}

export function linkTitleContactCta(): string {
  return 'Звʼязатися з Autocast для консультації'
}

export function linkTitleNewsArticle(articleTitle: string): string {
  return `Читати: ${safeText(articleTitle, 'стаття')}`
}

export function linkTitleAllNews(): string {
  return 'Переглянути всі новини Autocast'
}

export function linkTitleSearchResult(productName: string): string {
  return linkTitleProduct(productName)
}

// ── Image alt & title ───────────────────────────────────────────────────────

export function imageAltService(serviceName: string): string {
  const name = safeText(serviceName, 'Автопослуга')
  return `${name} — послуга Autocast у Житомирі`
}

export function imageTitleService(serviceName: string): string {
  const name = safeText(serviceName, 'Автопослуга')
  return `${name} — майстерня Autocast, Житомир`
}

export function imageAltProduct(productName: string, categoryName?: string | null): string {
  const name = safeText(productName, 'Товар')
  const category = categoryName ? `, категорія ${categoryName}` : ''
  return `Купити ${name} з доставкою по Україні${category}`
}

export function imageTitleProduct(productName: string): string {
  const name = safeText(productName, 'Товар')
  return `${name} — фото та характеристики`
}

export function imageAltProductGallery(productName: string, index: number, total?: number): string {
  const name = safeText(productName, 'Товар')
  if (total && total > 1) {
    return `${name} — фото ${index + 1} з ${total}`
  }
  return `${name} — фото товару Autocast`
}

export function imageTitleProductGallery(productName: string, index: number): string {
  return `${safeText(productName, 'Товар')} — зображення ${index + 1}`
}

export function imageAltCategory(categoryName: string): string {
  const name = safeText(categoryName, 'Категорія')
  return `Каталог ${name} — Autocast, автозапчастини Україна`
}

export function imageTitleCategory(categoryName: string): string {
  const name = safeText(categoryName, 'Категорія')
  return `${name} — перейти до каталогу`
}

export function imageAltHero(): string {
  return 'Autocast — автозвук, автосвітло та автоелектроніка в Житомирі'
}

export function imageTitleHero(): string {
  return 'Autocast — професійні послуги та магазин автоелектроніки'
}

export function imageAltAbout(): string {
  return 'Команда та майстерня Autocast у Житомирі'
}

export function imageTitleAbout(): string {
  return 'Autocast — наша команда та майстерня'
}

export function imageAltServiceWhy(serviceName: string): string {
  return `Чому важлива послуга «${safeText(serviceName, 'автопослуга')}» — Autocast`
}

export function imageTitleServiceWhy(serviceName: string): string {
  return `Переваги послуги «${safeText(serviceName, 'автопослуга')}» у Житомирі`
}

export function imageAltNews(articleTitle: string): string {
  return `${safeText(articleTitle, 'Новина')} — Autocast`
}

export function imageTitleNews(articleTitle: string): string {
  return safeText(articleTitle, 'Новина Autocast')
}
