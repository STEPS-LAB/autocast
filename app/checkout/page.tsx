'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
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

import npLogo from '@/public/images/np.png'
import ukrLogo from '@/public/images/ukr.png'
import visaLogo from '@/public/images/visa.png'
import mkLogo from '@/public/images/mk.svg'

type NpCitySuggestion = { ref: string; name: string; area?: string }
type NpPointSuggestion = { ref: string; name: string; number?: string; type: 'warehouse' | 'postomat' | 'other' }

type ShippingQuote = {
  shipping_total: number
  currency: 'UAH'
  eta: string | null
  rule_code: string
  label: string
}

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

function DeliveryLogo({ method }: { method: ShippingInfoInput['delivery_method'] }) {
  if (method === 'nova_poshta') {
    return (
      <span className="ml-auto shrink-0 inline-flex items-center justify-center">
        <Image
          src={npLogo}
          alt="Нова Пошта"
          height={40}
          className="h-[40px] w-auto object-contain"
        />
      </span>
    )
  }
  if (method === 'ukr_poshta') {
    return (
      <span className="ml-auto shrink-0 inline-flex items-center justify-center">
        <Image
          src={ukrLogo}
          alt="Укрпошта"
          height={36}
          className="h-[36px] w-auto object-contain"
        />
      </span>
    )
  }
  return null
}

function PaymentLogos({ method }: { method: ShippingInfoInput['payment_method'] }) {
  if (method !== 'card_on_delivery' && method !== 'online') return null

  return (
    <span className="ml-auto shrink-0 inline-flex items-center gap-2">
      <Image
        src={visaLogo}
        alt="Visa"
        height={29}
        className="h-[29px] w-auto object-contain"
      />
      <Image
        src={mkLogo}
        alt="Mastercard"
        height={36}
        className="h-[36px] w-auto object-contain"
      />
    </span>
  )
}

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
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null)
  const [shippingQuoteError, setShippingQuoteError] = useState('')

  const [npCity, setNpCity] = useState<NpCitySuggestion | null>(null)
  const [npPoint, setNpPoint] = useState<NpPointSuggestion | null>(null)
  const [npPointType, setNpPointType] = useState<'warehouse' | 'postomat'>('warehouse')

  const {
    register,
    control,
    handleSubmit,
    setValue,
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
  const paymentMethod = formValues.payment_method ?? 'cash_on_delivery'

  useEffect(() => {
    // Reset NP selections when method changes away from NP.
    setShippingQuote(null)
    setShippingQuoteError('')
    if (deliveryMethod !== 'nova_poshta') {
      setNpCity(null)
      setNpPoint(null)
    }
  }, [deliveryMethod])

  useEffect(() => {
    // Reset point when changing point type (warehouse/postomat).
    setNpPoint(null)
    setShippingQuote(null)
    setShippingQuoteError('')
    setValue('delivery_type', npPointType, { shouldValidate: true })
    setValue('np_point_ref', undefined)
    setValue('np_point_name', undefined)
  }, [npPointType])

  useEffect(() => {
    // Recalculate quote when selection is complete.
    if (deliveryMethod === 'pickup') {
      setShippingQuote({
        shipping_total: 0,
        currency: 'UAH',
        eta: null,
        rule_code: 'pickup_free',
        label: 'Самовивіз',
      })
      setShippingQuoteError('')
      return
    }

    if (deliveryMethod !== 'nova_poshta') {
      setShippingQuote(null)
      setShippingQuoteError('')
      return
    }

    if (!npCity || !npPoint) {
      setShippingQuote(null)
      setShippingQuoteError('')
      return
    }

    const ac = new AbortController()
    ;(async () => {
      try {
        setShippingQuoteError('')
        const res = await fetch('/api/checkout/shipping/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ac.signal,
          body: JSON.stringify({
            items_total: total,
            selection: {
              delivery_method: 'nova_poshta',
              delivery_type: npPointType,
              np_city_ref: npCity.ref,
              np_city_name: npCity.name,
              np_point_ref: npPoint.ref,
              np_point_name: npPoint.name,
              payment_method: paymentMethod,
              city: npCity.name,
              address: npPoint.name,
            },
          }),
        })

        if (!res.ok) {
          const payload = await res.json().catch(() => ({})) as { error?: string }
          setShippingQuote(null)
          setShippingQuoteError(payload.error ?? 'Не вдалося розрахувати доставку')
          return
        }

        const payload = await res.json() as { quote: ShippingQuote }
        setShippingQuote(payload.quote)
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return
        setShippingQuote(null)
        setShippingQuoteError('Не вдалося розрахувати доставку')
      }
    })()

    return () => ac.abort()
  }, [deliveryMethod, npCity, npPoint, npPointType, total, paymentMethod])

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
                  <OrderSummary total={total} count={count} shippingQuote={shippingQuote} />
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
                              className={[
                                'flex items-center gap-3 p-3 border border-border rounded cursor-pointer transition-colors hover:border-border-light will-change-transform',
                                deliveryMethod === opt.value
                                  ? '!bg-accent/20 [&_.radio-ring]:border-text-primary [&_.radio-dot]:bg-accent'
                                  : 'bg-bg-surface',
                              ].join(' ')}
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
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                                <p className="text-xs text-text-muted">{opt.desc}</p>
                              </div>
                              <DeliveryLogo method={opt.value as ShippingInfoInput['delivery_method']} />
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
                          <div
                            className={[
                              deliveryMethod === 'nova_poshta' ? 'overflow-visible' : 'overflow-hidden',
                              deliveryMethod === 'pickup' ? 'pointer-events-none' : '',
                            ].join(' ')}
                          >
                            {deliveryMethod === 'nova_poshta' ? (
                              <NovaPoshtaAddressFields
                                cityError={errors.city?.message}
                                addressError={errors.address?.message}
                                cityValue={formValues.city ?? ''}
                                addressValue={formValues.address ?? ''}
                                setFormValue={setValue}
                                pointType={npPointType}
                                onPointTypeChange={(t) => setNpPointType(t)}
                                onCityPicked={(c) => {
                                  setNpCity(c)
                                  setNpPoint(null)
                                  setValue('np_city_ref', c.ref, { shouldValidate: true })
                                  setValue('np_city_name', c.name)
                                  setValue('delivery_type', npPointType, { shouldValidate: true })
                                  setValue('np_point_ref', undefined)
                                  setValue('np_point_name', undefined)
                                }}
                                onPointPicked={(p) => {
                                  setNpPoint(p)
                                  setValue('delivery_type', npPointType, { shouldValidate: true })
                                  setValue('np_point_ref', p.ref, { shouldValidate: true })
                                  setValue('np_point_name', p.name)
                                }}
                                onCityInputChange={(next) => {
                                  // Keep compatibility with existing schema (city/address fields).
                                  // When user edits text manually, drop NP refs.
                                  if (npCity && next.trim() !== npCity.name.trim()) {
                                    setNpCity(null)
                                    setNpPoint(null)
                                    setValue('np_city_ref', undefined, { shouldValidate: true })
                                    setValue('np_city_name', undefined)
                                    setValue('np_point_ref', undefined, { shouldValidate: true })
                                    setValue('np_point_name', undefined)
                                  }
                                }}
                                onPointInputChange={(next) => {
                                  if (npPoint && next.trim() !== npPoint.name.trim()) {
                                    setNpPoint(null)
                                    setValue('np_point_ref', undefined, { shouldValidate: true })
                                    setValue('np_point_name', undefined)
                                  }
                                }}
                                registerCity={register('city')}
                                registerAddress={register('address')}
                              />
                            ) : (
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
                            )}

                            {deliveryMethod === 'nova_poshta' && shippingQuoteError && (
                              <p className="mt-2 text-xs text-error">{shippingQuoteError}</p>
                            )}
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
                              className={[
                                'flex items-center gap-3 p-3 border border-border rounded cursor-pointer transition-colors hover:border-border-light will-change-transform',
                                paymentMethod === opt.value
                                  ? '!bg-accent/20 [&_.radio-ring]:border-text-primary [&_.radio-dot]:bg-accent'
                                  : 'bg-bg-surface',
                              ].join(' ')}
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
                              <PaymentLogos method={opt.value as ShippingInfoInput['payment_method']} />
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
                        shippingQuote={shippingQuote}
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
  shippingQuote,
  info,
}: {
  total: number
  count: number
  shippingQuote?: ShippingQuote | null
  info?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    deliveryMethod: ShippingInfoInput['delivery_method']
  }
}) {
  const deliveryLabel = DELIVERY_OPTIONS.find(o => o.value === info?.deliveryMethod)?.label
  const shippingTotal = shippingQuote?.shipping_total ?? (info?.deliveryMethod === 'pickup' ? 0 : null)
  const grandTotal = total + (typeof shippingTotal === 'number' ? shippingTotal : 0)
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
          {shippingTotal === null ? (
            <span className="text-text-muted">—</span>
          ) : shippingTotal === 0 ? (
            <span className="text-success">Безкоштовно</span>
          ) : (
            <span className="text-text-primary price">{formatPrice(shippingTotal)}</span>
          )}
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
          <span className="text-lg text-text-primary price">{formatPrice(grandTotal)}</span>
        </div>
      </div>
    </motion.div>
  )
}

function NovaPoshtaAddressFields(props: {
  cityValue: string
  addressValue: string
  cityError?: string
  addressError?: string
  setFormValue: ReturnType<typeof useForm<ShippingInfoInput>>['setValue']
  pointType: 'warehouse' | 'postomat'
  onPointTypeChange: (t: 'warehouse' | 'postomat') => void
  onCityPicked: (c: NpCitySuggestion) => void
  onPointPicked: (p: NpPointSuggestion) => void
  onCityInputChange: (next: string) => void
  onPointInputChange: (next: string) => void
  registerCity: ReturnType<typeof useForm<ShippingInfoInput>>['register'] extends (name: 'city') => infer R ? R : any
  registerAddress: ReturnType<typeof useForm<ShippingInfoInput>>['register'] extends (name: 'address') => infer R ? R : any
}) {
  const listIdCity = useId()
  const listIdPoint = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const cityInputWrapRef = useRef<HTMLDivElement>(null)
  const pointInputWrapRef = useRef<HTMLDivElement>(null)
  const [openCity, setOpenCity] = useState(false)
  const [openPoint, setOpenPoint] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<NpCitySuggestion[]>([])
  const [pointSuggestions, setPointSuggestions] = useState<NpPointSuggestion[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [pointLoading, setPointLoading] = useState(false)
  const [cityFetchError, setCityFetchError] = useState('')
  const [pointFetchError, setPointFetchError] = useState('')
  const [cityHighlight, setCityHighlight] = useState(0)
  const [pointHighlight, setPointHighlight] = useState(0)
  const [cityDropdownRect, setCityDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null)
  const [pointDropdownRect, setPointDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null)

  // Local refs for selected city/point (to drive dependent fetching).
  const selectedCityRef = useRef<string | null>(null)

  useEffect(() => {
    function onDocPointerDown(e: MouseEvent) {
      // Dropdown is rendered in a portal (document.body), so treat clicks inside it as "inside".
      // Note: e.target can be a Text node; normalize to an Element.
      const el =
        e.target instanceof Element
          ? e.target
          : (e.target as any)?.parentElement instanceof Element
            ? (e.target as any).parentElement
            : null

      if (el?.closest('[data-np-dropdown]')) return
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenCity(false)
        setOpenPoint(false)
      }
    }
    document.addEventListener('mousedown', onDocPointerDown)
    return () => document.removeEventListener('mousedown', onDocPointerDown)
  }, [])

  function updateRects() {
    const cityEl = cityInputWrapRef.current
    const pointEl = pointInputWrapRef.current
    if (cityEl) {
      const r = cityEl.getBoundingClientRect()
      setCityDropdownRect({ left: r.left + window.scrollX, top: r.bottom + window.scrollY, width: r.width })
    }
    if (pointEl) {
      const r = pointEl.getBoundingClientRect()
      setPointDropdownRect({ left: r.left + window.scrollX, top: r.bottom + window.scrollY, width: r.width })
    }
  }

  useLayoutEffect(() => {
    updateRects()
    // Recompute on resize/layout changes.
    window.addEventListener('resize', updateRects)
    return () => {
      window.removeEventListener('resize', updateRects)
    }
  }, [])

  useEffect(() => {
    if (openCity || openPoint) updateRects()
  }, [openCity, openPoint])

  useEffect(() => {
    setCityHighlight(0)
  }, [props.cityValue, openCity])

  useEffect(() => {
    setPointHighlight(0)
  }, [props.addressValue, openPoint])

  useEffect(() => {
    const q = props.cityValue.trim()
    if (q.length < 2) {
      setCitySuggestions([])
      setCityFetchError('')
      return
    }
    const ac = new AbortController()
    const t = window.setTimeout(() => {
      ;(async () => {
        try {
          setCityLoading(true)
          setCityFetchError('')
          const res = await fetch(`/api/np/cities?query=${encodeURIComponent(q)}&limit=10`, { signal: ac.signal })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as { error?: string }
            setCitySuggestions([])
            setCityFetchError(payload.error ?? `Помилка API (${res.status})`)
            return
          }
          const payload = await res.json().catch(() => ({})) as { suggestions?: NpCitySuggestion[] }
          const next = Array.isArray(payload.suggestions) ? payload.suggestions : []
          setCitySuggestions(next)
          if (next.length === 0) setCityFetchError('Немає підказок. Уточніть запит.')
        } catch (e) {
          if ((e as any)?.name === 'AbortError') return
          setCitySuggestions([])
          setCityFetchError('Не вдалося отримати підказки')
        } finally {
          setCityLoading(false)
        }
      })()
    }, 350)
    return () => {
      ac.abort()
      window.clearTimeout(t)
    }
  }, [props.cityValue])

  useEffect(() => {
    const q = props.addressValue.trim()
    const cityRef = selectedCityRef.current
    if (!cityRef) {
      setPointSuggestions([])
      setPointFetchError('Спочатку оберіть місто зі списку')
      return
    }
    const ac = new AbortController()
    const t = window.setTimeout(() => {
      ;(async () => {
        try {
          setPointLoading(true)
          setPointFetchError('')
          const url = `/api/np/warehouses?cityRef=${encodeURIComponent(cityRef)}&query=${encodeURIComponent(q)}&type=${encodeURIComponent(props.pointType)}&limit=25`
          const res = await fetch(url, { signal: ac.signal })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as { error?: string }
            setPointSuggestions([])
            setPointFetchError(payload.error ?? `Помилка API (${res.status})`)
            return
          }
          const payload = await res.json().catch(() => ({})) as { suggestions?: NpPointSuggestion[] }
          const next = Array.isArray(payload.suggestions) ? payload.suggestions : []
          setPointSuggestions(next)
          if (next.length === 0) setPointFetchError('Немає підказок. Спробуйте інший запит.')
        } catch (e) {
          if ((e as any)?.name === 'AbortError') return
          setPointSuggestions([])
          setPointFetchError('Не вдалося отримати підказки')
        } finally {
          setPointLoading(false)
        }
      })()
    }, 350)
    return () => {
      ac.abort()
      window.clearTimeout(t)
    }
  }, [props.addressValue, props.pointType])

  function selectCity(c: NpCitySuggestion) {
    selectedCityRef.current = c.ref
    props.onCityPicked(c)
    props.setFormValue('city', c.name, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    // Clear point field when city changes
    props.setFormValue('address', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setOpenCity(false)
  }

  function selectPoint(p: NpPointSuggestion) {
    props.onPointPicked(p)
    props.setFormValue('address', p.name, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setOpenPoint(false)
  }

  function onCityKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openCity && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && citySuggestions.length > 0) {
      setOpenCity(true)
      return
    }
    if (!openCity) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpenCity(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCityHighlight(i => Math.min(i + 1, Math.max(citySuggestions.length - 1, 0)))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCityHighlight(i => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && citySuggestions.length > 0) {
      const c = citySuggestions[cityHighlight]
      if (c) {
        e.preventDefault()
        selectCity(c)
      }
    }
  }

  function onPointKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openPoint && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && pointSuggestions.length > 0) {
      setOpenPoint(true)
      return
    }
    if (!openPoint) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpenPoint(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setPointHighlight(i => Math.min(i + 1, Math.max(pointSuggestions.length - 1, 0)))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setPointHighlight(i => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && pointSuggestions.length > 0) {
      const p = pointSuggestions[pointHighlight]
      if (p) {
        e.preventDefault()
        selectPoint(p)
      }
    }
  }

  const showCityList = openCity && citySuggestions.length > 0
  const showPointList = openPoint && pointSuggestions.length > 0

  return (
    <div ref={containerRef} className="grid sm:grid-cols-2 gap-4">
      <div ref={cityInputWrapRef} className="relative">
        <div className="flex items-end justify-between gap-2 mb-1.5">
          <span className="text-sm font-medium text-text-secondary">Місто (НП)</span>
          <span aria-hidden="true" className="h-9 w-[108px]" />
        </div>
        <Input
          label={undefined}
          placeholder="Почніть вводити місто…"
          error={props.cityError}
          autoComplete="off"
          {...props.registerCity}
          onChange={(e) => {
            props.registerCity.onChange(e)
            props.onCityInputChange(e.target.value)
            setOpenCity(true)
          }}
          onFocus={() => setOpenCity(true)}
          onKeyDown={onCityKeyDown}
          rightIcon={(
            <span
              className={[
                'size-4 border-2 border-accent border-t-transparent rounded-full animate-spin',
                cityLoading ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
          )}
        />
        {!showCityList && openCity && props.cityValue.trim().length >= 2 && cityFetchError && (
          <p className="mt-1 text-xs text-text-muted">{cityFetchError}</p>
        )}
      </div>

      <div ref={pointInputWrapRef} className="relative">
        <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <span className="text-sm font-medium text-text-secondary">Відділення / Поштомат</span>
          <div className="inline-flex h-9 w-full sm:w-auto rounded-md border border-border bg-bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => props.onPointTypeChange('warehouse')}
              className={[
                'h-full flex-1 px-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                props.pointType === 'warehouse'
                  ? 'bg-accent/20 text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
              ].join(' ')}
            >
              Відділення
            </button>
            <button
              type="button"
              onClick={() => props.onPointTypeChange('postomat')}
              className={[
                'h-full flex-1 px-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                props.pointType === 'postomat'
                  ? 'bg-accent/20 text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
              ].join(' ')}
            >
              Поштомат
            </button>
          </div>
        </div>

        <Input
          label={undefined}
          placeholder={props.pointType === 'postomat' ? 'Поштомат…' : 'Відділення…'}
          error={props.addressError}
          autoComplete="off"
          {...props.registerAddress}
          onChange={(e) => {
            props.registerAddress.onChange(e)
            props.onPointInputChange(e.target.value)
            setOpenPoint(true)
          }}
          onFocus={() => setOpenPoint(true)}
          onKeyDown={onPointKeyDown}
          rightIcon={(
            <span
              className={[
                'size-4 border-2 border-accent border-t-transparent rounded-full animate-spin',
                pointLoading ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
          )}
        />
        {!showPointList && openPoint && pointFetchError && (
          <p className="mt-1 text-xs text-text-muted">{pointFetchError}</p>
        )}

      </div>

      {typeof document !== 'undefined' && showCityList && cityDropdownRect && createPortal(
        <ul
          id={listIdCity}
          role="listbox"
          data-np-dropdown="city"
          style={{
            position: 'absolute',
            left: cityDropdownRect.left,
            top: cityDropdownRect.top + 4,
            width: cityDropdownRect.width,
            zIndex: 10050,
          }}
          className="rounded border border-border bg-bg-surface py-1 shadow-lg"
        >
          {citySuggestions.slice(0, 8).map((c, i) => (
            <li key={c.ref} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === cityHighlight}
                onMouseEnter={() => setCityHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  // Prevent the document-level "outside click" handler (same element) from running.
                  ;(e.nativeEvent as any)?.stopImmediatePropagation?.()
                  selectCity(c)
                }}
                className={[
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  i === cityHighlight
                    ? 'bg-accent/20 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                ].join(' ')}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}

      {typeof document !== 'undefined' && showPointList && pointDropdownRect && createPortal(
        <ul
          id={listIdPoint}
          role="listbox"
          data-np-dropdown="point"
          style={{
            position: 'absolute',
            left: pointDropdownRect.left,
            top: pointDropdownRect.top + 4,
            width: pointDropdownRect.width,
            zIndex: 10050,
          }}
          className="rounded border border-border bg-bg-surface py-1 shadow-lg"
        >
          {pointSuggestions.slice(0, 8).map((p, i) => (
            <li key={p.ref} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === pointHighlight}
                onMouseEnter={() => setPointHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  ;(e.nativeEvent as any)?.stopImmediatePropagation?.()
                  selectPoint(p)
                }}
                className={[
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  i === pointHighlight
                    ? 'bg-accent/20 text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                ].join(' ')}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
