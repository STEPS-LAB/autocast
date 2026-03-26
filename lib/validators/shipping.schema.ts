import { z } from 'zod'

export const shippingDeliveryTypeSchema = z.enum(['warehouse', 'postomat', 'courier', 'pickup'])

export const shippingSelectionSchema = z.object({
  delivery_method: z.enum(['nova_poshta', 'ukr_poshta', 'pickup']),
  delivery_type: shippingDeliveryTypeSchema.default('warehouse'),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  np_city_ref: z.string().trim().optional(),
  np_city_name: z.string().trim().optional(),
  np_point_ref: z.string().trim().optional(),
  np_point_name: z.string().trim().optional(),
  payment_method: z.enum(['cash_on_delivery', 'card_on_delivery', 'online']),
})
.superRefine((value, ctx) => {
  if (value.delivery_method === 'pickup') return

  if (!value.city && !value.np_city_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['city'],
      message: 'Вкажіть місто доставки',
    })
  }

  if (value.delivery_method === 'nova_poshta') {
    if (!value.np_city_ref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['np_city_ref'],
        message: 'Оберіть місто зі списку НП',
      })
    }
    if (value.delivery_type !== 'courier' && !value.np_point_ref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['np_point_ref'],
        message: 'Оберіть відділення або поштомат',
      })
    }
  } else if (!value.address || value.address.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['address'],
      message: 'Вкажіть адресу доставки',
    })
  }
})

export const shippingQuoteRequestSchema = z.object({
  items_total: z.coerce.number().min(0),
  selection: shippingSelectionSchema,
})

export type ShippingQuoteRequest = z.infer<typeof shippingQuoteRequestSchema>
