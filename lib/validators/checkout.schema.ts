import { z } from 'zod'

export const shippingInfoSchema = z.object({
  first_name: z.string().min(2, 'Введіть імʼя'),
  last_name: z.string().min(2, 'Введіть прізвище'),
  email: z.string().email('Введіть коректний email'),
  phone: z
    .string()
    .min(10, 'Введіть номер телефону')
    .regex(/^\+?[\d\s\-()]+$/, 'Некоректний формат номеру'),
  city: z.string().min(2, 'Введіть місто'),
  address: z.string().min(5, 'Введіть адресу'),
  delivery_method: z.enum(['nova_poshta', 'ukr_poshta', 'pickup']),
  payment_method: z.enum(['cash_on_delivery', 'card_on_delivery', 'online']),
  notes: z.string().optional(),
})

export type ShippingInfoInput = z.infer<typeof shippingInfoSchema>
