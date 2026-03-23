import { z } from 'zod'

export const productSchema = z.object({
  slug: z.string().min(3, 'Slug мінімум 3 символи'),
  name_ua: z.string().min(3, 'Назва мінімум 3 символи'),
  description_ua: z.string().min(10, 'Опис мінімум 10 символів'),
  price: z.number().min(0, 'Ціна не може бути від\'ємною'),
  sale_price: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0, 'Залишок не може бути від\'ємним'),
  category_id: z.string().uuid('Виберіть категорію'),
  brand_id: z.string().uuid().nullable().optional(),
  specs: z.record(z.string(), z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  is_featured: z.boolean().optional(),
})

export type ProductInput = z.infer<typeof productSchema>
