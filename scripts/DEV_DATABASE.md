# Dev database (окремо від production)

Локальна розробка має підключатись до **окремого** Supabase-проєкту, щоб не змінювати production.

## Варіант A — новий dev-проєкт (рекомендовано)

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project** (наприклад `autocast-dev`).
2. Скопіюйте URL та anon key з **Project Settings → API**.
3. Створіть `.env.local` у корені репозиторію:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-DEV-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. У **SQL Editor** dev-проєкту виконайте міграції по порядку з `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_product_reviews_and_videos.sql`
   - `002_storage_buckets.sql`
   - `003_harden_orders_rls.sql`
   - `004_remove_guest_order_mutations.sql`
   - `005_inventory_transactions.sql`
   - `006_shipping_totals_and_ttn.sql`
   - `007_update_create_order_with_inventory_shipping.sql`
   - `008_services.sql`
   - `009_services_content_and_sorting.sql`
   - `010_preferred_currency.sql`

5. Зареєструйтесь на `http://localhost:3000/register`.
6. Виконайте `scripts/dev-grant-admin.sql` (підставте свій UUID) → доступ до `/admin`.

## Варіант B — клон production (якщо є доступ до prod backup)

Потрібен доступ до production Supabase (owner або той, хто може зробити backup).

1. Prod: **Database → Backups** → restore у **новий** проєкт (не в існуючий prod).
2. Або `pg_dump` з prod connection string → import у dev-проєкт.
3. Після клону застосуйте лише **нові** міграції, яких ще немає на клоні (наприклад `010_preferred_currency.sql`).
4. У dev змініть пароль тестового адміна / видайте собі `role = 'admin'` через `dev-grant-admin.sql`.

## Важливо

- **Ніколи** не використовуйте production `.env` у `.env.local` для розробки.
- На Vercel Preview використовуйте dev/staging Supabase або окремі env для preview.
- Після зміни `.env.local` перезапустіть `npm run dev`.
