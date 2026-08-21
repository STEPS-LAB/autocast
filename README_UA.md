# Каталог

Каталог на сайті (`lib/data/catalog-db.ts`) завжди читається **тільки з Supabase**. Демо-товари з `lib/data/seed.ts` у продакшені не підставляються. Якщо таблиці порожні або RLS блокує читання — показується порожній каталог і підказка в UI.

# Autocast — Преміальна Платформа Автомагазину

Готова до виробництва, преміальна платформа для інтернет-магазину автозапчастин та електроніки, побудована на Next.js 15, TypeScript, TailwindCSS та Supabase.

## Технічний стек

| Рівень | Технологія |
|---|---|
| Frontend | Next.js 15 (App Router), React 19 |
| Мова | TypeScript (strict mode) |
| Стилізація | TailwindCSS v4 з кастомними токенами |
| Анімації | Framer Motion |
| Стан | Zustand (кошик, збереження) |
| Форми | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Тестування | Vitest + Playwright |
| Деплой | Власний Node-сервер (standalone) за nginx |

## Функціональність

- **Преміальний темний UI** — glassmorphism, parallax, Framer Motion переходи
- **Розумний пошук** — автодоповнення, навігація клавіатурою, нещодавні/популярні запити
- **VIN-декодер** — абстрактний API шар з демо-реалізацією, легко замінити
- **Каталог товарів** — категорії, фільтри (ціна, бренд, наявність), сортування, QuickView
- **Сторінка товару** — галерея з зумом, таблиця характеристик, фіксований AddToCart на мобільних
- **Кошик** — Zustand state, виїзна панель, збереження в localStorage
- **Оформлення замовлення** — анімований 3-кроковий флоу (Кошик → Дані → Підтвердження)
- **AI-консультант** — плаваючий віджет чату з відповідями українською мовою
- **Mobile-first** — нижня навігаційна панель, адаптивний на всіх розмірах
- **Система авторизації** — Supabase email/password + Google OAuth, RLS-захист
- **Адмін-панель** — аналітика дашборду, таблиці з вбудованим редагуванням
- **Тести** — Vitest unit тести + Playwright E2E

## Швидкий старт

### Вимоги

- Node.js 20+
- npm 10+
- Акаунт Supabase (безкоштовний tier підходить)

### 1. Встановлення

```bash
cd autocast
npm install
```

### 2. Змінні середовища

```bash
cp .env.example .env.local
```

Заповніть ваші Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Налаштування бази даних

Виконайте міграцію в Supabase SQL Editor:

```bash
# Скопіюйте та виконайте supabase/migrations/001_initial_schema.sql у Supabase SQL Editor
```

### 4. Запуск сервера розробки

```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000)

> **Примітка:** Застосунок повністю працює без налаштованого Supabase — використовуються локальні тестові дані для товарів, категорій та пошуку. Auth функції потребують Supabase.

## Структура проекту

```
autocast/
├── app/                    # Next.js App Router сторінки
│   ├── page.tsx            # Головна сторінка
│   ├── shop/               # Каталог товарів
│   ├── product/[slug]/     # Сторінка товару
│   ├── cart/               # Кошик
│   ├── checkout/           # Оформлення замовлення
│   ├── login/              # Сторінки авторизації
│   ├── register/
│   ├── account/            # Акаунт користувача
│   ├── admin/              # Адмін-панель
│   └── api/                # API маршрути (пошук, VIN, AI)
├── components/             # React компоненти
│   ├── ui/                 # Базові примітиви (Button, Input тощо)
│   ├── layout/             # Header, Footer, MobileNav
│   ├── home/               # Секції головної сторінки
│   ├── search/             # Розумний пошук
│   ├── shop/               # Сітка товарів, фільтри
│   ├── product/            # Компоненти сторінки товару
│   ├── cart/               # Панель кошика
│   ├── checkout/           # Степпер оформлення
│   ├── ai/                 # AI-асистент
│   └── admin/              # Адмін компоненти
├── lib/                    # Утиліти та бізнес-логіка
│   ├── supabase/           # Supabase клієнти
│   ├── store/cart.ts       # Zustand store кошика
│   ├── hooks/              # Кастомні React хуки
│   ├── data/seed.ts        # Тестові дані товарів
│   └── validators/         # Zod схеми
├── types/index.ts          # TypeScript типи
├── tests/
│   ├── unit/               # Vitest unit тести
│   └── e2e/                # Playwright E2E тести
└── supabase/migrations/    # SQL міграції
```

## Доступні скрипти

```bash
npm run dev          # Запустити сервер розробки
npm run build        # Зібрати для production
npm run start        # Запустити production сервер
npm run lint         # Запустити ESLint
npm run test         # Запустити Vitest unit тести
npm run test:watch   # Vitest в режимі watch
npm run test:e2e     # Запустити Playwright E2E тести
npm run test:e2e:ui  # Playwright з UI
```

## Дизайн-система

### Кольори

| Токен | Значення | Використання |
|---|---|---|
| `--color-bg-primary` | `#09090B` | Фон сторінки |
| `--color-bg-surface` | `#18181B` | Фон карток |
| `--color-bg-elevated` | `#27272A` | Підвищені панелі |
| `--color-text-primary` | `#FAFAFA` | Основний текст |
| `--color-text-secondary` | `#A1A1AA` | Другорядний текст |
| `--color-accent` | `#DC2626` | Автомобільний червоний акцент |
| `--color-border` | `#3F3F46` | Границі |

## Деплой (власний VPS)

Проєкт не привʼязаний до жодної платформи: немає `vercel.json`, немає
edge-роутів, немає SDK провайдера. Збірка дає автономний Node-сервер
(`output: 'standalone'` у `next.config.ts`), який працює за nginx.

### Рекомендація: збирайте не на сервері

`next build` потребує 2-4 ГБ RAM. На малому VPS збирайте локально або в CI і
відправляйте готовий артефакт — на 2 ГБ збірку вбʼє OOM.

### Варіант A — Docker Compose

```bash
cp .env.example .env      # впишіть ключі Supabase і NEXT_PUBLIC_SITE_URL
docker compose up -d --build
```

Далі — nginx попереду:

```bash
sudo cp deploy/nginx-cache.conf /etc/nginx/conf.d/autocast-cache.conf
sudo cp deploy/nginx.conf /etc/nginx/sites-available/autocast
sudo ln -s /etc/nginx/sites-available/autocast /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

### Варіант B — чистий Node + systemd

```bash
npm run build:standalone                        # створює .next/standalone
rsync -a .next/standalone/ user@server:/srv/autocast/
scp .env user@server:/srv/autocast/.env
sudo cp deploy/autocast.service /etc/systemd/system/
sudo systemctl enable --now autocast
```

### Змінні середовища

Скопіюйте `.env.example` і заповніть. Важливо: кожне значення `NEXT_PUBLIC_*`
**вшивається під час збірки** — щоб змінити його, потрібен ребілд, а не
рестарт. `NEXT_PUBLIC_SITE_URL` обовʼязковий у продакшені: без нього редиректи
авторизації та листи відновлення пароля вказуватимуть на `localhost:3000`.

Перевірити, що саме побачив сервер: `GET /api/health/env`.

### Нотатки для слабких серверів

- Оптимізація зображень (AVIF/WebP) — найважча CPU-операція. Конфіг nginx
  кешує `/_next/image` на диску 30 днів; якщо серверу все одно важко —
  приберіть `'image/avif'` з `next.config.ts`.
- ISR та `unstable_cache` пишуть у `.next/cache`. Docker Compose монтує туди
  volume, щоб кеш переживав рестарти.
- Імпорти Excel/YML в адмінці їдять багато памʼяті. Краще запускати скрипти
  синхронізації (`npm run caralarm:catalog`) поза сервером.
- Ревалідація каталогу — звичайний вебхук: `POST /api/cron/revalidate-catalog`
  із заголовком `Authorization: Bearer $CRON_SECRET`. Викликайте з cron або CI.

## Налаштування Google OAuth

1. Створіть OAuth додаток у Google Cloud Console
2. Додайте authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Увімкніть Google провайдер у Supabase Dashboard → Auth → Providers
4. Введіть Google Client ID та Secret

## Доступ до адмін-панелі

1. Створіть акаунт на `/register`
2. У Supabase SQL Editor виконайте:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'ваш-user-uuid';
   ```
3. Перейдіть на `/admin`

## Ліцензія

MIT
