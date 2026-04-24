# LensTrack — Digital Lens Authentication Platform

A full-stack, production-ready multi-portal SaaS application for digitally authenticating Lenstrack lenses.

---

## Architecture Overview

```
lenstrack/
├── apps/
│   └── web/                    # Next.js 14 (App Router) — all three portals
├── packages/
│   ├── db/                     # Prisma schema + seed data
│   ├── ui/                     # Shared component primitives
│   └── config/                 # Shared constants + error codes
├── workers/
│   └── pdf-worker/             # BullMQ + Puppeteer PDF generation worker
├── docker-compose.yml          # PostgreSQL 15 + Redis 7
└── .env.example
```

---

## Three Portals

| Portal | URL | Purpose |
|--------|-----|---------|
| **Admin** | `/admin` | Manage stores, users, products, orders, reports |
| **Store** | `/store` | Issue lens authentications to customers |
| **Customer** | `/verify` | Verify and view authenticated lens records |

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd lenstrack
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values — defaults work for local development
```

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 4. Setup database

```bash
# Push schema to database
pnpm db:push

# Seed with sample data
pnpm db:seed
```

### 5. Start the development server

```bash
# Start Next.js app
pnpm dev

# In a separate terminal: start the PDF worker
pnpm worker:dev
```

### 6. Open in browser

- **Customer/Verify Portal**: http://localhost:3000/verify
- **Store Portal**: http://localhost:3000/store/login
- **Admin Portal**: http://localhost:3000/admin/login

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@lenstrack.com | Admin@123 |
| **Store User (Mumbai)** | mumbai@lenstrack.com | Store@123 |
| **Store User (Delhi)** | delhi@lenstrack.com | Store@123 |
| **Store User (Bangalore)** | bangalore@lenstrack.com | Store@123 |

---

## Port Mapping

| Service | Port |
|---------|------|
| Next.js app | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Prisma Studio | 5555 |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://lenstrack:lenstrack@localhost:5432/lenstrack` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | — |
| `ADMIN_JWT_EXPIRES` | Admin JWT expiry | `15m` |
| `STORE_JWT_EXPIRES` | Store user JWT expiry | `8h` |
| `CUSTOMER_JWT_EXPIRES` | Customer JWT expiry | `24h` |
| `OTP_TTL_SECONDS` | OTP validity duration | `300` (5 min) |
| `OTP_RATE_LIMIT_MAX` | Max OTP requests per window | `5` |
| `OTP_RATE_LIMIT_WINDOW_SECONDS` | Rate limit window | `900` (15 min) |
| `NEXT_PUBLIC_BASE_URL` | Public URL for QR codes | `http://localhost:3000` |
| `SMS_PROVIDER` | SMS provider (`mock`, `msg91`) | `mock` |
| `SMS_API_KEY` | MSG91/Twilio API key | — |
| `PDF_OUTPUT_DIR` | Directory for generated PDFs | `./public/pdfs` |
| `QR_OUTPUT_DIR` | Directory for QR code images | `./public/qrcodes` |

### Vercel: manual env vars & future `git push`

**A normal `git push` / deploy does not change** anything under **Vercel → Project → Settings → Environment Variables**.

- This repo’s `apps/web/vercel.json` only sets install/framework hints — **no `env` block** that would sync secrets from Git into the dashboard.
- There is **no** committed `.env.production` (or similar) with real credentials; `.env` / `.env.local` stay **gitignored**.
- `apps/web/next.config.js` **reads** `process.env` **during `next build`** on Vercel and may inline **`NEXT_PUBLIC_*`** into the bundle — values still **come from the dashboard** (or Vercel system vars like `VERCEL_URL`). It does **not** call the Vercel API to overwrite your saved variables.

The **only** ways dashboard values change are: you edit them yourself, or you explicitly use Vercel features such as **Import .env** / API tokens that modify project env.

---

## Development Notes

### OTP in Dev Mode
In development (`NODE_ENV=development`), OTP is **logged to console** and also returned in the API response as `devOtp`. The customer verify page shows a yellow dev helper banner displaying the OTP.

### PDF Generation
PDFs are generated asynchronously via BullMQ. The PDF worker must be running separately:
```bash
pnpm worker:dev
```
PDFs are saved to `apps/web/public/pdfs/` and the order's `pdfUrl` is updated.

### SMS Provider
By default, SMS is mocked (`console.log`). To use MSG91:
1. Set `SMS_PROVIDER=msg91` in `.env`
2. Set `SMS_API_KEY=your-api-key`
3. Set `SMS_TEMPLATE_ID=your-template-id`

---

## Database Management

```bash
# View and edit data in browser
pnpm db:studio

# Create a new migration
pnpm db:migrate

# Push schema to Postgres (creates tables — use the SAME DATABASE_URL as production)
# From repo root, after: export DATABASE_URL='postgresql://...'
pnpm db:push

# Re-seed database
pnpm db:seed
```

### Production OTP fails with `P2021` / `DB_ERROR`

`P2021` means **a table Prisma expects is missing** in the database behind your `DATABASE_URL` (often `OtpRecord`).

1. In **Vercel**, copy the exact **`DATABASE_URL`** (Production) — must not be empty after save (re-paste if you used Edit on a Sensitive var).
2. On your machine, from repo root:

   ```bash
   export DATABASE_URL='paste-the-same-url-as-vercel'
   pnpm db:push
   ```

3. In **Neon → SQL Editor**, confirm tables exist:

   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
   ```

   You should see `OtpRecord` among others.

4. If `pnpm db:push` errors on the **pooler** URL, use Neon’s **direct (non-pooler)** connection string for pushes only, then switch Vercel back to pooler if you prefer.

5. **Neon branch**: `db push` must run against the **same branch** as the connection string Vercel uses (e.g. `main` vs `development`).

---

## Key Design Decisions

### Product Snapshot Pattern
When an order is created, the full product data (name, category, benefits, warranty, etc.) is snapshotted into `OrderLensItem.productSnapshot` as JSON. This ensures the authentication card always shows the product data **as it was at the time of issue**, even if the product is later modified or deleted.

### JWT Architecture
- **Admin**: Short-lived access token (15min) stored in httpOnly cookie
- **Store**: Longer-lived (8h) for operational convenience
- **Customer**: 24h session via OTP verification
- **Middleware**: Lightweight JWT payload decoder (no crypto in Edge Runtime)

### Multi-portal Security
- Store API routes always extract `storeId` from JWT claims — never from request body
- Admin routes are fully protected; store users can only see their own store's data
- Public verify endpoint (`/api/verify/:authCode`) requires no authentication

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 15 (via Prisma ORM) |
| Cache/Queue | Redis 7 + BullMQ |
| Auth | JWT (jsonwebtoken) |
| PDF | Puppeteer (headless Chromium) |
| QR Code | `qrcode` npm package |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| State | Zustand + TanStack Query |
| Drag & Drop | @dnd-kit |
| Monorepo | Turborepo + pnpm workspaces |
