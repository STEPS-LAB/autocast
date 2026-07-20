import { revalidatePath, revalidateTag } from 'next/cache'

/** Скидає кеш каталогу після імпорту або масових змін у товарах. */
export function revalidateCatalogCache() {
  revalidateTag('catalog-products', 'max')
  revalidateTag('catalog-categories', 'max')
  revalidatePath('/shop', 'layout')
  revalidatePath('/product', 'layout')
  revalidatePath('/admin/products')
}
