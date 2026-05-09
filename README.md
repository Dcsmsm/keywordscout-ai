# KeywordScout — Find keywords you can actually rank.

AI-native SEO tool for bloggers and creators. Discover low-competition keywords with real ranking potential through SERP weakness analysis, opportunity scoring, and AI-powered content angles.

---

## Features

- **SERP Weakness Analysis** — detect Reddit, Quora, weak domains, and outdated content in top results
- **Opportunity Score** — AI composite score (weakness + volume + difficulty)
- **Content Angle Generator** — specific content strategies based on what the SERP is missing
- **Keyword Clustering** — group keywords into topic clusters automatically
- **Multi-provider SERP** — SerpApi, Serper.dev, DataForSEO, with auto-fallback
- **Stripe Billing** — Free / Pro / Business plans with usage limits
- **Admin Panel** — user management, provider switching, analytics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Route Handlers, Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Billing | Stripe |
| Validation | Zod |
| Deploy | Vercel |

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/keywordscout-ai
cd keywordscout-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials (see sections below).

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Setup

### 1. Create project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **API keys** from Project Settings → API

### 2. Run migrations

In the Supabase Dashboard → SQL Editor, run the migration:

```sql
-- Copy and paste the contents of:
supabase/migrations/001_initial_schema.sql
```

### 3. Set environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Create admin user

After signing up, run this SQL to grant yourself admin role:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Stripe Setup

### 1. Create products

In Stripe Dashboard → Products, create:

| Product | Price | Billing |
|---------|-------|---------|
| KeywordScout Pro | $29 | Monthly |
| KeywordScout Business | $99 | Monthly |

### 2. Get Price IDs and add to `.env.local`

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

### 3. Configure webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Production webhooks

In Stripe Dashboard → Webhooks, add endpoint:
`https://your-domain.com/api/stripe/webhook`

Events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`

---

## SERP Provider Setup

Configure at least one provider. The mock provider works out of the box for testing.

### SerpApi

```env
SERPAPI_API_KEY=your-key
```

### Serper.dev

```env
SERPER_API_KEY=your-key
```

### DataForSEO

```env
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password
```

### Activating a provider

Log in as admin → `/admin/providers` → click **Set Active**

---

## Deploy to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "Initial commit"
git push origin main
```

1. Go to [vercel.com](https://vercel.com) → New Project → Import `keywordscout-ai`
2. Add all environment variables from `.env.example`
3. Deploy

---

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # User dashboard, analyses, billing, settings
│   ├── (admin)/             # Admin panel (role-protected)
│   ├── api/
│   │   ├── keyword/analyze/ # Core analysis endpoint
│   │   ├── providers/test/  # Provider testing
│   │   ├── admin/providers/ # Provider management
│   │   └── stripe/          # Checkout, webhook, portal
│   └── page.tsx             # Landing page
├── components/
│   ├── landing/             # Hero, Features, Pricing, FAQ, Footer
│   ├── dashboard/           # Dashboard components
│   └── admin/               # Admin components
├── lib/
│   ├── supabase/            # client, server, admin clients
│   ├── stripe/              # Stripe client + plan config
│   ├── providers/           # SerpApi, Serper, DataForSEO, Mock + factory
│   └── ai/                  # Scoring, ideation, clustering
├── types/                   # Database, providers, analysis types
└── middleware.ts             # Auth + admin route protection
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

### Scoring Algorithm

1. **SERP Weakness Score** (0–100): Reddit (+20), Quora (+15), forums (+10), weak domains (+15), outdated results (+20), video (+5)
2. **Opportunity Score** (0–100): `weakness × 0.5 + volumeScore - difficultyPenalty + 10`
3. **Difficulty Estimate**: strong domains (+15 each), forums (−10), weak domains (−8)

---

## License

MIT
