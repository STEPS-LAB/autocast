# Autocast — Premium Automotive E-Commerce Platform

A production-ready, ultra-premium automotive parts and electronics store built with Next.js 15, TypeScript, TailwindCSS, and Supabase.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS v4 with custom design tokens |
| Animations | Framer Motion |
| State | Zustand (cart, persisted) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Testing | Vitest + Playwright |
| Deployment | Vercel |

## Features

- **Premium dark UI** — glassmorphism, parallax, smooth Framer Motion transitions
- **Smart Search** — debounced autocomplete, keyboard navigation, recent/popular searches
- **VIN Decoder** — abstract API layer with demo implementation, easily replaceable
- **Product Catalog** — categories, filters (by price, brand, stock), sort, QuickView modal
- **Product Pages** — image gallery with zoom, spec table, sticky mobile AddToCart
- **Shopping Cart** — Zustand state, slide-out drawer, persistent localStorage
- **Multi-step Checkout** — animated 3-step flow (Cart → Info → Confirmation)
- **AI Sales Concierge** — floating chat widget with Ukrainian responses
- **Mobile-first** — bottom navigation bar, responsive at all breakpoints
- **Auth System** — Supabase email/password + Google OAuth, RLS-protected
- **Admin Panel** — dashboard analytics, inline-edit tables for Products/Categories/Orders/Users
- **Test Suite** — Vitest unit tests + Playwright E2E

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (free tier works)

### 1. Clone & Install

```bash
cd autocast
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup

Run the migration in your Supabase SQL Editor:

```bash
# Copy and run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** The app works fully without Supabase configured — it uses local seed data for products, categories, and search. Auth features require Supabase.

## Project Structure

```
autocast/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Homepage
│   ├── shop/               # Product catalog
│   ├── product/[slug]/     # Product detail
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── login/              # Auth pages
│   ├── register/
│   ├── account/            # User account
│   ├── admin/              # Admin panel
│   └── api/                # API routes (search, VIN, AI)
├── components/             # React components
│   ├── ui/                 # Base primitives (Button, Input, etc.)
│   ├── layout/             # Header, Footer, MobileNav
│   ├── home/               # Homepage sections
│   ├── search/             # Smart search
│   ├── shop/               # Product grid, filters
│   ├── product/            # Product detail components
│   ├── cart/               # Cart drawer
│   ├── checkout/           # Checkout stepper
│   ├── ai/                 # AI assistant
│   └── admin/              # Admin components
├── lib/                    # Utilities & business logic
│   ├── supabase/           # Supabase clients
│   ├── store/cart.ts       # Zustand cart store
│   ├── hooks/              # Custom React hooks
│   ├── data/seed.ts        # Mock product data
│   └── validators/         # Zod schemas
├── types/index.ts          # TypeScript types
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
└── supabase/migrations/    # SQL migrations
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Playwright with UI
```

## Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-bg-primary` | `#09090B` | Page background |
| `--color-bg-surface` | `#18181B` | Card backgrounds |
| `--color-bg-elevated` | `#27272A` | Elevated panels |
| `--color-text-primary` | `#FAFAFA` | Primary text |
| `--color-text-secondary` | `#A1A1AA` | Secondary text |
| `--color-accent` | `#DC2626` | Automotive red accent |
| `--color-border` | `#3F3F46` | Borders |

### Typography

- **Display**: Inter (variable font, Latin + Cyrillic)
- **Mono**: JetBrains Mono (prices, VIN codes, specs)

## Deployment (Vercel)

1. Push to GitHub
2. Connect repository in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy

The app is pre-configured for Vercel with:
- Next.js Image optimization
- Edge caching headers
- `generateStaticParams` for product pages

## Auth Setup (Google OAuth)

1. Create OAuth app in Google Cloud Console
2. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Enable Google provider in Supabase Dashboard → Auth → Providers
4. Enter Google Client ID and Secret

## Admin Access

1. Create a user account at `/register`
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
   ```
3. Navigate to `/admin`

## License

MIT
