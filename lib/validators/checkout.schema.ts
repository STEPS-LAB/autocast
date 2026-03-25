import { z } from 'zod'

export const shippingInfoSchema = z.object({
  first_name: z.string().min(2, 'Введіть імʼя'),
  last_name: z.string().min(2, 'Введіть прізвище'),
  email: z.string().email('Введіть коректний email'),
  // Stored as 9 digits (without country code and leading 0), masked in UI.
  phone: z
    .string()
    .regex(/^\d+$/, 'Некоректний формат номеру')
    .length(9, 'Введіть номер телефону'),
  city: z.string().optional(),
  address: z.string().optional(),
  delivery_method: z.enum(['nova_poshta', 'ukr_poshta', 'pickup']),
  payment_method: z.enum(['cash_on_delivery', 'card_on_delivery', 'online']),
  notes: z.string().optional(),
})
  .superRefine((data, ctx) => {
    if (data.delivery_method === 'pickup') return
    if (!data.city || data.city.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'Введіть місто' })
    }
    if (!data.address || data.address.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Введіть адресу' })
    }
  })

export type ShippingInfoInput = z.infer<typeof shippingInfoSchema>
