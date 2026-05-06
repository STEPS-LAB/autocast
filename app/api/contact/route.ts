import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rateLimit'
import { createServiceClient } from '@/lib/supabase/server'

const schema = z.object({
  name: z.string().trim().min(2, 'Введіть імʼя'),
  email: z.string().trim().email('Некоректний email'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(value => !value || /^\d{9}$/.test(value), 'Некоректний номер'),
  message: z.string().trim().min(10, 'Повідомлення мінімум 10 символів'),
})

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSmtpConfig() {
  const host = process.env['SMTP_HOST']
  const portRaw = process.env['SMTP_PORT']
  const user = process.env['SMTP_USER']
  const pass = process.env['SMTP_PASS']
  const from = process.env['CONTACT_FROM_EMAIL'] ?? user

  if (!host || !portRaw || !user || !pass || !from) return null

  const port = Number(portRaw)
  if (!Number.isFinite(port) || port <= 0) return null

  return { host, port, user, pass, from }
}

async function getAdminRecipientEmails() {
  const service = await createServiceClient()
  const [{ data: profiles }, usersResult] = await Promise.all([
    service
      .from('profiles')
      .select('id')
      .eq('role', 'admin'),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const adminIds = new Set((profiles ?? []).map(profile => profile.id))
  if (adminIds.size === 0) return []

  const emails: string[] = []
  for (const user of usersResult.data.users) {
    if (adminIds.has(user.id) && user.email) emails.push(user.email)
  }

  return Array.from(new Set(emails))
}

export async function POST(request: Request) {
  try {
    const rl = rateLimit(request, { bucket: 'contact:form', limit: 5, windowMs: 60_000 })
    if (!rl.ok) return rl.response

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Перевірте правильність заповнення форми' }, { status: 400 })
    }

    const smtp = getSmtpConfig()
    if (!smtp) {
      return NextResponse.json({ error: 'Пошта не налаштована на сервері' }, { status: 500 })
    }
    const adminEmails = await getAdminRecipientEmails()
    if (adminEmails.length === 0) {
      return NextResponse.json({ error: 'Не знайдено email адміністратора' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    })

    const phone = parsed.data.phone ? `+38(0${parsed.data.phone})` : 'Не вказано'
    const submittedAt = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
    const safeName = escapeHtml(parsed.data.name)
    const safeEmail = escapeHtml(parsed.data.email)
    const safePhone = escapeHtml(phone)
    const safeDate = escapeHtml(submittedAt)
    const safeMessage = escapeHtml(parsed.data.message).replace(/\n/g, '<br/>')

    await transporter.sendMail({
      from: smtp.from,
      to: adminEmails,
      replyTo: parsed.data.email,
      subject: `Нове повідомлення з Contact: ${parsed.data.name}`,
      text: [
        'Нове повідомлення з форми "Контакти"',
        '',
        `Ім'я: ${parsed.data.name}`,
        `Телефон: ${phone}`,
        `Email: ${parsed.data.email}`,
        `Дата: ${submittedAt}`,
        '',
        'Повідомлення:',
        parsed.data.message,
      ].join('\n'),
      html: `
        <h2>Нове повідомлення з форми "Контакти"</h2>
        <p><strong>Ім'я:</strong> ${safeName}</p>
        <p><strong>Телефон:</strong> ${safePhone}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Дата:</strong> ${safeDate}</p>
        <p><strong>Повідомлення:</strong></p>
        <p>${safeMessage}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалось надіслати повідомлення. Спробуйте ще раз.' },
      { status: 500 },
    )
  }
}
