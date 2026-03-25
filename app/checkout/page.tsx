'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore, selectCartTotal, selectCartCount } from '@/lib/store/cart'
import { shippingInfoSchema, type ShippingInfoInput } from '@/lib/validators/checkout.schema'
import { formatPrice } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import PageTransition from '@/components/layout/PageTransition'

const STEPS = [
  { id: 1, label: 'Кошик' },
  { id: 2, label: 'Дані' },
  { id: 3, label: 'Підтвердження' },
]

const DELIVERY_OPTIONS = [
  { value: 'nova_poshta', label: 'Нова Пошта', desc: '1-2 робочих дні' },
  { value: 'ukr_poshta', label: 'Укрпошта', desc: '3-5 робочих днів' },
  { value: 'pickup', label: 'Самовивіз', desc: 'м. Житомир, вулиця Вітрука, 12в' },
]

const PAYMENT_OPTIONS = [
  { value: 'cash_on_delivery', label: 'Готівка при отриманні' },
  { value: 'card_on_delivery', label: 'Карткою при отриманні' },
  { value: 'online', label: 'Онлайн оплата (Demo)' },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

const cardHover = {
  whileHover: { y: -2, boxShadow: '0 16px 34px rgba(0,0,0,0.12)' },
  transition: { duration: 0.18 },
} as const

const optionHover = {
  whileHover: { y: -1, boxShadow: '0 12px 26px rgba(0,0,0,0.10)' },
  whileTap: { scale: 0.99 },
  transition: { duration: 0.16 },
} as const

function extractPhoneDigits(value: string) {
  const onlyDigits = value.replace(/\D/g, '')
  const withoutCountry = onlyDigits.startsWith('380') ? onlyDigits.slice(3) : onlyDigits
  const withoutLeadingZero = withoutCountry.startsWith('0') ? withoutCountry.slice(1) : withoutCountry
  return withoutLeadingZero.slice(0, 9)
}

function formatPhoneMask(digits: string) {
  if (!digits) return '+38(0'

  let result = '+38(0'
  if (digits.length > 0) result += digits.slice(0, 2)
  if (digits.length >= 2) result += ')'
  if (digits.length > 2) result += `-${digits.slice(2, 5)}`
  if (digits.length > 5) result += `-${digits.slice(5, 7)}`
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`
  return result
}

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const total = useCartStore(selectCartTotal)
  const count = useCartStore(selectCartCount)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [orderNumber, setOrderNumber] = useState('')
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingInfoInput>({
    resolver: zodResolver(shippingInfoSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      delivery_method: 'nova_poshta',
      payment_method: 'cash_on_delivery',
    },
  })

  const formValues = useWatch({ control })
  const deliveryMethod = formValues.delivery_method ?? 'nova_poshta'

  if (items.length === 0 && step !== 3) {
    return (
      <PageTransition>
        <div className="container-xl py-24 flex flex-col items-center text-center gap-6">
          <ShoppingBag size={48} className="text-text-muted" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Кошик порожній</h1>
            <p className="text-text-secondary">Додайте товари перед оформленням</p>
          </div>
          <Link href="/shop"><Button size="lg">В магазин</Button></Link>
        </div>
      </PageTransition>
    )
  }

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  async function onSubmit(data: ShippingInfoInput) {
    setSubmitError('')
    const payload = {
      shipping_info: data,
      items: items.map(item => ({
        product_id: item.product.id,
        qty: item.quantity,
        unit_price: item.product.sale_price ?? item.product.price,
      })),
    }
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const fallback = 'Не вдалося оформити замовлення. Спробуйте ще раз.'
      try {
        const err = await response.json() as { error?: string }
        setSubmitError(err?.error ?? fallback)
      } catch {
        setSubmitError(fallback)
      }
      return
    }

    const created = await response.json() as { number?: string }
    setOrderNumber(created.number ?? '')
    clearCart()
    goTo(3)
  }

  return (
    <PageTransition>
      <div className="container-xl py-10 max-w-4xl">
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4">
            <ArrowLeft size={14} /> Повернутися до кошика
          </Link>
          <h1 className="text-headline text-text-primary">Оформлення замовлення</h1>
        </div>

        <CheckoutStepper steps={STEPS} current={step} />

        <div className="mt-10">
          <AnimatePresence custom={direction} mode="wait">
            {/* Step 1: Cart review */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-3">
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        {...cardHover}
                        className="flex gap-3 p-3 bg-bg-surface border border-border rounded-md transition-shadow will-change-transform"
                      >
                        <div className="relative size-14 rounded bg-bg-elevated overflow-hidden shrink-0 border border-border">
                          {item.product.images[0] && (
                            <Image src={item.product.images[0]} alt={item.product.name_ua} fill className="object-cover" sizes="56px" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary line-clamp-1">{item.product.name_ua}</p>
                          <p className="text-xs text-text-muted mt-0.5">{item.quantity} шт.</p>
                        </div>
                        <span className="text-sm font-semibold text-text-primary price shrink-0">
                          {formatPrice((item.product.sale_price ?? item.product.price) * item.quantity)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <OrderSummary total={total} count={count} />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="lg" onClick={() => goTo(2)} className="gap-2">
                    Далі <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Info form */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      {/* Personal info */}
                      <section>
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                          Особисті дані
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            label="Імʼя"
                            placeholder="Ваше імʼя.."
                            error={errors.first_name?.message}
                            {...register('first_name', {
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/\d/g, '')
                              },
                            })}
                          />
                          <Input
                            label="Прізвище"
                            placeholder="Ваше прізвище.."
                            error={errors.last_name?.message}
                            {...register('last_name', {
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/\d/g, '')
                              },
                            })}
                          />
                          <Input
                            label="Email"
                            type="email"
                            placeholder="Ваша електронна пошта.."
                            error={errors.email?.message}
                            {...register('email')}
                          />
                          <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                              <Input
                                label="Телефон"
                                type="text"
                                inputMode="numeric"
                                placeholder="+38(0__)-___-__-__"
                                error={errors.phone?.message}
                                value={formatPhoneMask(field.value ?? '')}
                                onChange={e => {
                                  field.onChange(extractPhoneDigits(e.target.value))
                                }}
                                onFocus={e => {
                                  const input = e.currentTarget
                                  const cursorPosition = (field.value ?? '').length === 0 ? 5 : e.currentTarget.value.length
                                  setTimeout(() => {
                                    input?.setSelectionRange(cursorPosition, cursorPosition)
                                  }, 0)
                                }}
                                onClick={e => {
                                  const input = e.currentTarget
                                  const cursorPosition = (field.value ?? '').length === 0 ? 5 : e.currentTarget.value.length
                                  setTimeout(() => {
                                    input?.setSelectionRange(cursorPosition, cursorPosition)
                                  }, 0)
                                }}
                                onKeyDown={e => {
                                  if ((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.metaKey) {
                                    e.preventDefault()
                                    const current = field.value ?? ''
                                    field.onChange(current.slice(0, -1))
                                  }
                                }}
                              />
                            )}
                          />
                        </div>
                      </section>

                      {/* Delivery */}
                      <section>
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                          Доставка
                        </h3>
                        <div className="space-y-2 mb-4">
                          {DELIVERY_OPTIONS.map(opt => (
                            <motion.label
                              key={opt.value}
                              {...optionHover}
                              className="flex items-center gap-3 p-3 bg-bg-surface border border-border rounded cursor-pointer transition-colors hover:border-border-light will-change-transform has-[:checked]:border-accent has-[:checked]:bg-accent/20 has-[:checked]:[&_.radio-ring]:border-text-primary has-[:checked]:[&_.radio-dot]:bg-accent"
                            >
                              <input
                                type="radio"
                                value={opt.value}
                                className="sr-only"
                                {...register('delivery_method')}
                              />
                              <span
                                aria-hidden="true"
                                className={[
                                  'radio-ring shrink-0 size-4 rounded-full border-2 border-border',
                                  'flex items-center justify-center',
                                  'transition-colors',
                                ].join(' ')}
                              >
                                <span className="radio-dot block size-2 rounded-full bg-transparent" />
                              </span>
                              <div>
                                <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                                <p className="text-xs text-text-muted">{opt.desc}</p>
                              </div>
                            </motion.label>
                          ))}
                        </div>
                        <div
                          aria-hidden={deliveryMethod === 'pickup'}
                          className={[
                            'grid transition-[grid-template-rows,margin-top] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                            deliveryMethod !== 'pickup' ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr] mt-0',
                          ].join(' ')}
                        >
                          <div className={['overflow-hidden', deliveryMethod === 'pickup' ? 'pointer-events-none' : ''].join(' ')}>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <Input
                                label="Місто"
                                placeholder="Київ"
                                error={errors.city?.message}
                                {...register('city')}
                              />
                              <Input
                                label="Відділення / Адреса"
                                placeholder="Відділення №1"
                                error={errors.address?.message}
                                {...register('address')}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Payment */}
                      <section>
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                          Оплата
                        </h3>
                        <div className="space-y-2">
                          {PAYMENT_OPTIONS.map(opt => (
                            <motion.label
                              key={opt.value}
                              {...optionHover}
                              className="flex items-center gap-3 p-3 bg-bg-surface border border-border rounded cursor-pointer transition-colors hover:border-border-light will-change-transform has-[:checked]:border-accent has-[:checked]:bg-accent/20 has-[:checked]:[&_.radio-ring]:border-text-primary has-[:checked]:[&_.radio-dot]:bg-accent"
                            >
                              <input
                                type="radio"
                                value={opt.value}
                                className="sr-only"
                                {...register('payment_method')}
                              />
                              <span
                                aria-hidden="true"
                                className={[
                                  'radio-ring shrink-0 size-4 rounded-full border-2 border-border',
                                  'flex items-center justify-center',
                                  'transition-colors',
                                ].join(' ')}
                              >
                                <span className="radio-dot block size-2 rounded-full bg-transparent" />
                              </span>
                              <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                            </motion.label>
                          ))}
                        </div>
                      </section>

                      {/* Notes */}
                      <div>
                        <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                          Коментар до замовлення
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Додаткові побажання…"
                          className="w-full bg-bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                          {...register('notes')}
                        />
                      </div>
                    </div>

                    <div className="lg:mt-[54px]">
                      <OrderSummary
                        total={total}
                        count={count}
                        info={{
                          firstName: formValues.first_name ?? '',
                          lastName: formValues.last_name ?? '',
                          email: formValues.email ?? '',
                          phone: formatPhoneMask(formValues.phone ?? ''),
                          deliveryMethod: deliveryMethod,
                        }}
                      />
                    </div>
                  </div>

                  {submitError && (
                    <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text-primary">
                      {submitError}
                    </div>
                  )}

                  <div className="mt-6 flex justify-between">
                    <Button variant="ghost" size="lg" type="button" onClick={() => goTo(1)} className="gap-2">
                      <ArrowLeft size={18} /> Назад
                    </Button>
                    <Button size="lg" type="submit" className="gap-2">
                      Підтвердити <ArrowRight size={18} />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-16 flex flex-col items-center gap-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="size-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center"
                >
                  <CheckCircle2 size={40} className="text-success" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Замовлення оформлено!
                  </h2>
                  <p className="text-text-secondary">
                    Дякуємо за покупку. Ми зв&apos;яжемося з вами найближчим часом.
                  </p>
                </div>

                {orderNumber && (
                  <div className="px-5 py-3 bg-bg-elevated border border-border rounded-md">
                    <p className="text-xs text-text-muted mb-1">Номер замовлення</p>
                    <p className="text-lg font-bold text-accent font-mono tracking-wider">
                      {orderNumber}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Link href="/shop">
                    <Button variant="secondary" size="lg">Продовжити покупки</Button>
                  </Link>
                  <Link href="/account">
                    <Button size="lg">Мої замовлення</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}

function OrderSummary({
  total,
  count,
  info,
}: {
  total: number
  count: number
  info?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    deliveryMethod: ShippingInfoInput['delivery_method']
  }
}) {
  const deliveryLabel = DELIVERY_OPTIONS.find(o => o.value === info?.deliveryMethod)?.label
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      whileHover={cardHover.whileHover}
      className="bg-bg-surface border border-border rounded-md p-5 h-fit sticky top-24 transition-shadow will-change-transform"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-4">Підсумок</h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Товари ({count})</span>
          <span className="price text-text-primary">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Доставка</span>
          <span className="text-success">Безкоштовно</span>
        </div>
      </div>

      {info && (
        <div className="border-t border-border pt-3 mb-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Імʼя</span>
            <span className="text-text-primary font-medium text-right">
              {(info.firstName || info.lastName) ? `${info.firstName} ${info.lastName}`.trim() : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Email</span>
            <span className="text-text-primary font-medium text-right break-all">
              {info.email || '—'}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Телефон</span>
            <span className="text-text-primary font-medium text-right">
              {info.phone && info.phone !== '+38(0' ? info.phone : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-text-secondary">Доставка</span>
            <span className="text-text-primary font-medium text-right">
              {deliveryLabel ?? '—'}
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <div className="flex justify-between font-semibold">
          <span className="text-text-primary">Разом</span>
          <span className="text-lg text-text-primary price">{formatPrice(total)}</span>
        </div>
      </div>
    </motion.div>
  )
}
