# 🚴 VeloPortal — Bicycle Marketplace, Rental & Repair Platform

> **KCA University · School of Technology · Diploma in Information Technology (STU701)**  
> Candidate: **Elvis Muthomi** (25/01220) · Supervisor: Madam Faith · June 2026

VeloPortal is a production-ready full-stack web application for Nairobi's cycling community:  
buy bicycles / accessories / equipment, rent by the hour, book expert repairs, join events,
customize your build, and connect with other riders — all backed by live **M-Pesa Daraja** STK Push payments.

---

## Table of Contents

> 🚀 **Deploying this to a public URL for clients/testers?** See **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**
> for the exact GitHub → Vercel (frontend) → Render (backend + database) steps.

1. [What's included](#1-whats-included)
2. [Role-based access](#2-role-based-access)
3. [Tech stack](#3-tech-stack)
4. [Quick start (local)](#4-quick-start-local)
5. [Email / SMTP setup](#5-email--smtp-setup)
6. [M-Pesa Daraja setup](#6-m-pesa-daraja-setup)
7. [SEO & Google Analytics](#7-seo--google-analytics)
8. [Receipt format](#8-receipt-format)
9. [Running the tests](#9-running-the-tests)
10. [Project structure](#10-project-structure)
11. [Key API endpoints](#11-key-api-endpoints)
12. [Security measures](#12-security-measures)
13. [Production deployment notes](#13-production-deployment-notes)

---

## 1. What's included

| Area | Functionality |
|---|---|
| **Home** | Interactive parallax hero, stats bar, services grid, events teaser, testimonials, FAQ accordion, CTA — unique section design |
| **Shop** | Bicycles + accessories + equipment (3 product types), search, category/sort/price filters, stock badges ("Only 2 left"), skeleton loading, pagination |
| **Product detail** | Image, stock status, add-to-cart with qty, wishlist toggle, reviews with star rating |
| **Rentals** | Fleet browser by category, live availability check, M-Pesa STK push booking, receipt modal, retry-payment |
| **Bike customizer** | Step-by-step frame → fork → wheel → handlebar → drivetrain selector with live client-side mechanical compatibility check (headtube tolerance + wheel-size), save/delete builds |
| **Repair** | Service catalog, sticky booking form, repair history with status badges |
| **Events** | 10 seeded events, search, date-chip cards, capacity-aware registration, ticket codes |
| **Community** | Post feed with inline comments, like toggle, load-more pagination |
| **Auth** | Register (name / student reg. no. / email / phone / password), login, forgot/reset password, email verification — welcome + order confirmation emails via SMTP |
| **User dashboard** | Overview stats, orders (with retry), rentals (with receipt + penalty payment), repairs, event tickets, saved builds, **full profile CRUD** (name, email, phone, reg. no., avatar URL), change password, account deactivation |
| **Operations console** (`/admin`) | Role-gated tabs: bicycles & accessories CRUD + restock, customizer components, categories CRUD, orders, rentals (check-in + late fee), repairs queue, events CRUD with images, users + online/offline status + role changes, community moderation, payments log |
| **Receipts** | Ledger-style KCA Micro-Station receipt on every paid order/rental, print button, M-Pesa receipt number, late-fee line |
| **Dark/light mode** | Persisted via localStorage, toggle in navbar + floating dock |
| **Floating action dock** | 5 buttons: dark mode toggle, share, "surprise me" random bike, WhatsApp support, quick feedback |
| **SEO** | Full meta tags, Open Graph, Twitter Card, JSON-LD structured data, sitemap.xml, robots.txt, Google Analytics 4 page tracking hook, Google Search Console verification tag |
| **PWA** | manifest.json, theme-color, apple-touch-icon |
| **Security** | `protect` on all data routes (no anonymous access to catalog), rate limiting on auth + payments, bcrypt passwords, JWT roles enforced server-side, permission-denied modal for 401/403 |

---

## 2. Role-based access

| Role | Can do | Cannot |
|---|---|---|
| **customer** (default) | Shop, cart, checkout, rentals, repairs, events, community, customizer, own dashboard | Anything under `/admin` |
| **mechanic** | View + update repair queue status only | Inventory, orders, users, payments |
| **staff** | Inventory CRUD, orders, rentals, events CRUD, community moderation, ops summary | Users, payments, categories |
| **admin** (super admin) | Everything — plus promote/demote users, deactivate accounts, categories CRUD, payments log | — |

All boundaries are enforced **server-side** in `backend/middleware/auth.js`. The frontend only hides inaccessible tabs; the API rejects unauthorized requests regardless.

**Demo accounts** (created by `npm run seed`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@veloportal.app` | `Admin@12345` |
| Mechanic | `mechanic@veloportal.app` | `Mechanic@12345` |
| Staff | `staff@veloportal.app` | `Staff@12345` |
| Customer | `rider@veloportal.app` | `Rider@12345` |

---

## 3. Tech stack

**Backend:** Node.js, Express, PostgreSQL, Sequelize ORM, JWT, bcrypt, Nodemailer (SMTP), express-rate-limit, Helmet, Jest  
**Frontend:** React 18, React Router v6, Vite, Tailwind CSS, Axios, Google Analytics 4  
**Payments:** Safaricom Daraja API (M-Pesa STK Push)  
**Infra:** Docker Compose (PostgreSQL), Vercel/Render (recommended free hosting)

---

## 4. Quick start (local)

### Option A — one command, full stack (recommended)

```bash
git clone https://github.com/<your-username>/veloportal.git
cd veloportal
docker compose up -d --build
```

This builds and starts **three containers**: `veloportal-postgres`, `veloportal-backend`
(port 5000), and `veloportal-frontend` (port 5173), already wired to talk to each other.

```bash
docker compose ps          # all three should show "running" (postgres: "healthy")
docker compose exec backend npm run seed   # populate demo data (run once)
```

Then open **http://localhost:5173**. To pass in real M-Pesa/SMTP credentials, create a `.env`
file next to `docker-compose.yml` (see section 6 for the variable names) — Compose reads it
automatically.

```bash
docker compose logs -f backend    # tail API logs
docker compose down               # stop everything
```

### Option B — manual (two terminals, no Docker for the app itself)

```bash
# 1. Clone
git clone https://github.com/<your-username>/veloportal.git
cd veloportal

# 2. Start PostgreSQL only
docker compose up -d postgres     # or install PostgreSQL locally and create DB "veloportal"

# 3. Backend
cd backend
npm install
cp .env.example .env          # fill in your values — see sections 5 & 6 below
npm run seed                  # creates all categories, bikes, accessories, events, demo users
npm run dev                   # API at http://localhost:5000

# 4. Frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # App at http://localhost:5173
```

---

## 5. Email / SMTP setup

VeloPortal sends real emails on signup (welcome + email verification) and after checkout (order confirmation). Configure SMTP in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password   # NOT your Gmail password — see below
EMAIL_FROM_NAME=VeloPortal
EMAIL_FROM_ADDR=noreply@yourdomain.com
```

**Gmail App Password (anti-spam setup):**
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App passwords
3. Generate a new App Password for "Mail / Other (VeloPortal)"
4. Paste the 16-character password as `SMTP_PASS`

> If `SMTP_USER` is not set, emails are logged to the server console instead of being sent — the app runs fine without SMTP configured.

**Other providers:**
- SendGrid: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_USER=apikey`, `SMTP_PASS=SG.xxx`
- Brevo (ex-Sendinblue): `SMTP_HOST=smtp-relay.brevo.com`
- Outlook: `SMTP_HOST=smtp.office365.com`

**Anti-spam measures already in place:**
- Proper `From` header with a real domain
- Plain-text alternative for every HTML email
- `List-Unsubscribe` header
- `Precedence: transactional` header
- No spammy words in subject lines
- Clean, minimal HTML that renders well in dark mode

---

## 6. M-Pesa Daraja setup

Payments go through the Safaricom Daraja sandbox endpoint:  
`https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`

**Required env vars:**
```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=ulbCRpPtoQ1IwFc347HmyPdsKWffT91nePDaXNxCZPfAH2ga
MPESA_CONSUMER_SECRET=QlXfqdSuXP3E3H35ZyAPCGRqSi78XWSOoOU28tWAsU2o3HIfCb9HeJAsvx8C38Om
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=Safaricom123!!
MPESA_PARTY_A=600983
MPESA_PARTY_B=600000
MPESA_CALLBACK_URL=https://your-public-domain.com/api/payments/mpesa/callback
```

> ⚠️ **Daraja requires a public `https://` callback URL** — `localhost` won't work.  
> Use [ngrok](https://ngrok.com) for local development: `ngrok http 5000`  
> Then set `MPESA_CALLBACK_URL=https://xxxx.ngrok-free.app/api/payments/mpesa/callback`  
> (Not required for payments to work at all — see the Troubleshooting section — but recommended.)

**Which credentials STK Push actually uses:** only `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`,
`MPESA_SHORTCODE`, and `MPESA_PASSKEY`. `MPESA_INITIATOR_NAME`/`PASSWORD` and `MPESA_PARTY_A` are
kept in `.env` for reference (they come from the Daraja app dashboard) but belong to a different
Daraja product (B2C/reversal-style APIs), not Lipa Na M-Pesa Online. `backend/utils/mpesa.js`
automatically sets `PartyB` to equal `BusinessShortCode` for every STK Push request, per Daraja's
requirement — a separate `PartyB` value (like `600000`) makes Daraja reject the request outright.

**Payment flow:**
1. Customer checks out → `POST /api/orders/checkout` → M-Pesa STK push fired
2. Customer enters PIN on phone → Daraja calls `POST /api/payments/mpesa/callback`
3. Receipt modal polls `GET /api/orders/:id` and updates when payment is confirmed
4. If STK push fails, the order is saved as `pending_payment` with a "Retry M-Pesa" button in the
   dashboard, and the real Daraja rejection reason is printed to the backend terminal
   (`[mpesa] STK push failed: ...`) — check there first if a payment attempt fails.

**Test phone for Daraja sandbox:** `254708374149` (Safaricom's published test number)

---

## 7. SEO & Google Analytics

**Google Search Console verification:**
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add Property → enter your site URL
3. Choose "HTML tag" verification method
4. Copy the `content` value
5. Replace `REPLACE_WITH_YOUR_VERIFICATION_CODE` in `frontend/index.html`

**Google Analytics 4:**
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a property → Data Streams → Web → copy the Measurement ID (`G-XXXXXXXXXX`)
3. Replace both instances of `G-XXXXXXXXXX` in `frontend/index.html`

**Page tracking** is wired automatically via `frontend/src/hooks/useAnalytics.js` — fires a `page_view` event on every route change.

**SEO already implemented:**
- `<title>` and `<meta description>` optimised for Nairobi bicycle searches
- Open Graph tags for WhatsApp/Facebook/LinkedIn sharing
- Twitter/X card for tweet previews
- JSON-LD structured data (`Store` schema) for Google rich snippets
- `sitemap.xml` and `robots.txt` in `frontend/public/`
- PWA `manifest.json` with theme colours

---

## 8. Receipt format

Every paid order and rental produces a ledger-style receipt matching the SDS specification:

```
VELOPORTAL MICRO-STATION
KCA Campus Operational Hub Ledger
─────────────────────────────────
Rider Reference Name: Elvis Muthomi
University Reg ID: 25/01220
Tracked Vehicle Model: Urban Tourer #9042
Aggregated Time Checked: 5 Hours Total
─────────────────────────────────
Base Reservation Fee:        500.00 KES
Late Return Penalty (2 hrs): 200.00 KES
─────────────────────────────────
TOTAL LEDGER PAID:           700.00 KES
```

- Rendered by `frontend/src/components/LedgerReceipt.jsx`
- Appears in the receipt modal after checkout/rental booking
- Available from the dashboard "Orders" and "Rentals" tabs (View receipt button)
- "Print receipt" button opens browser print with print-only CSS that hides all other UI

**Late fees:** Staff use the "Check in now" button (Rentals tab in the admin console) to log the actual return time. The API auto-calculates `lateHours × hourlyRate`. Riders see the outstanding penalty in their dashboard with a "Pay penalty via M-Pesa" button.

---

## 9. Running the tests

```bash
cd backend

# Option A: zero-dependency Node runner (no npm install needed, runs immediately)
node tests/verify-logic.js

# Option B: Jest (after npm install)
npm test
npm run test:watch     # watch mode during development
```

**Test coverage:**
- `tests/compatibility.test.js` — 9 cases covering the bike customizer's mechanical fit rule (fork headtube tolerance, wheel-size matching), the same logic used server-side and client-side
- `tests/phone.test.js` — 6 cases covering M-Pesa phone number normalisation to Daraja's `2547XXXXXXXX` format

All 15 tests pass on the current codebase.

---

## 10. Project structure

```
veloportal/
├── backend/
│   ├── config/db.js              Sequelize/PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.js               JWT protect, requireRole, adminOnly, staffOrAdmin…
│   │   ├── errorHandler.js       Centralised 404 + 500 handlers
│   │   └── rateLimit.js          Per-endpoint rate limiters (auth, payments, general)
│   ├── models/index.js           All Sequelize models + associations
│   ├── routes/                   auth, products, cart, orders, rentals, repairs,
│   │                             events, community, payments, users, customizer, admin
│   ├── utils/
│   │   ├── compatibility.js      Pure bike-fit rule logic (testable without DB)
│   │   ├── email.js              Nodemailer SMTP — welcome, reset, order confirmation
│   │   ├── mpesa.js              Daraja OAuth + STK Push + STK Query
│   │   └── phone.js              Kenyan phone normalisation (dependency-free)
│   ├── seed/seed.js              Full data seed — bikes, accessories, equipment, 10 events…
│   ├── tests/
│   │   ├── verify-logic.js       Zero-dependency Node test runner (runs without npm install)
│   │   ├── compatibility.test.js Jest unit tests — bike compatibility rule
│   │   └── phone.test.js         Jest unit tests — phone normalisation
│   └── server.js                 Express app entry point
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json         PWA manifest
│   │   ├── robots.txt            Search engine crawl rules
│   │   └── sitemap.xml           XML sitemap for Google
│   ├── src/
│   │   ├── api/client.js         Axios instance + 401/403 permission-denied events
│   │   ├── components/           Navbar (handlebar design), Footer (social links),
│   │   │                         ProductCard, Reveal (scroll animation), Modal,
│   │   │                         ReceiptModal, LedgerReceipt, FloatingActions,
│   │   │                         PermissionModal, ProtectedRoute, StarRating
│   │   ├── context/              AuthContext, CartContext, ThemeContext (dark/light)
│   │   ├── hooks/useAnalytics.js GA4 page tracking hook
│   │   └── pages/                Home, Shop, ProductDetail, Cart, Checkout,
│   │                             OrderConfirmation, Rentals, RentalDetail, Repair,
│   │                             Events, EventDetail, Community, Customizer,
│   │                             Login, Register, ForgotPassword,
│   │                             Dashboard, AdminDashboard, NotFound
│   ├── index.html                Full SEO meta, OG, JSON-LD, GA4 gtag.js
│   └── tailwind.config.js        Complete design-token system
│
├── docs/
│   ├── VeloPortal_System_Test_Plan.pdf   Academic test plan (Chapter 7)
│   └── README.md                          Test plan → codebase mapping + manual UAT checklist
│
├── docker-compose.yml            One-command local PostgreSQL
└── README.md                     This file
```

---

## 11. Key API endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account (sends welcome email) |
| POST | `/api/auth/login` | Public | Sign in |
| GET/PUT | `/api/auth/me` | User | View/update profile |
| PUT | `/api/auth/change-password` | User | Change password |
| DELETE | `/api/auth/me` | User | Deactivate own account |
| GET | `/api/products` | User | Search/filter bicycles, accessories, equipment |
| POST | `/api/orders/checkout` | User | Create order + M-Pesa STK push |
| POST | `/api/orders/:id/retry-payment` | User | Re-fire STK push for pending order |
| GET | `/api/rentals/availability/:id` | User | Check date-range availability |
| POST | `/api/rentals` | User | Book rental + M-Pesa STK push |
| PUT | `/api/rentals/:id/checkin` | Staff/Admin | Log return, auto-calculate late fee |
| POST | `/api/rentals/:id/pay-penalty` | User | Pay late fee via M-Pesa |
| GET/POST | `/api/repairs/services` `/api/repairs/bookings` | User | Repair catalog + bookings |
| GET/POST/PUT/DELETE | `/api/events` | User/Staff | Events + CRUD |
| POST | `/api/events/:slug/register` | User | Event registration |
| GET/POST | `/api/community/posts` | User | Community feed |
| GET/POST/DELETE | `/api/customizer/frames` `/components` `/builds` | User | Bike customizer |
| POST | `/api/payments/mpesa/callback` | Public (Daraja) | Payment webhook |
| PUT | `/api/users/heartbeat` | User | Online presence ping |
| GET | `/api/admin/overview` | Admin | Financial analytics |
| GET/POST/PUT/DELETE | `/api/admin/bicycles` `/categories` `/components` | Staff/Admin | Inventory CRUD |
| GET | `/api/admin/low-stock` | Staff/Admin | Low-stock alerts |
| GET/PUT | `/api/admin/users/:id/role` | Admin | User role management |

---

## 12. Security measures

- **No anonymous data access** — every catalog/listing route uses `protect` middleware; visitors must have an account
- **JWT** with server-side role checks on every protected route — frontend hiding a tab is UX only, never the actual gate
- **Rate limiting** — general API (300/15min), auth endpoints (20/15min), M-Pesa triggers (10/10min)
- **Helmet** security headers; CORS restricted to `CLIENT_URL`
- **Parameterized queries** via Sequelize — no raw SQL string concatenation
- **bcrypt** (10 rounds) for password hashing
- **Permission-denied modal** — 401/403 responses are surfaced with a clear "why can't I do this" popup
- **Account deactivation** — soft delete; admins can't demote or deactivate their own account
- **Secrets** in `.env` only — the `.env` file is git-ignored; only `.env.example` is committed

---

## 13. Troubleshooting

**"Invalid email or password" / "Registration failed" even with correct credentials**
This is almost always **database schema drift**, not a login bug. Plain `sequelize.sync()` only
creates tables that don't exist yet — it never adds new columns to a table that's already there.
This project's models gained many fields over its iterations (`regNumber`, `lastSeenAt`,
`isActive`, `avatarUrl`, `productType`, and more) — if your database was first created before some
of those existed and was never fully reseeded, the live table can silently drift out of sync with
the code, which surfaces as confusing login/registration failures.

Two fixes, in order:
1. **Already applied** — `server.js` now runs `sequelize.sync({ alter: true })` outside
   production, which auto-adds any missing columns every time the backend starts. Just restart
   the backend (`npm run dev`, or `docker compose restart backend`) and try again.
2. **If that's not enough (nuclear option — wipes all data)**: fully reset and reseed:
   ```bash
   cd backend
   npm run seed        # runs sequelize.sync({ force: true }) — drops and recreates every table
   ```
   or with Docker:
   ```bash
   docker compose down -v          # -v removes the Postgres volume too
   docker compose up -d --build
   docker compose exec backend npm run seed
   ```
   Then log in again with the demo accounts (section 2) or register a fresh account.

**The ngrok/callback-URL text in your terminal is guidance, not an error**
When the backend starts, it checks whether `MPESA_CALLBACK_URL` can actually work and prints
step-by-step instructions if not — that block starting with "→ Fix: run `ngrok http 5000`..." is
informational, not a crash, and it **no longer blocks payments**. It's completely unrelated to
login/registration. To act on it (recommended, but optional — see below):
1. Install ngrok, then run: `ngrok http 5000` (5000 = the **backend** port, not 5173/frontend)
2. Copy the `https://xxxx.ngrok-free.app` URL it prints
3. In `backend/.env`, set: `MPESA_CALLBACK_URL=https://xxxx.ngrok-free.app/api/payments/mpesa/callback`
4. Restart the backend — the warning disappears once the URL is a real `https://` address pointing
   at port 5000

*You can also just leave it as the placeholder and payments will still work* — `backend/utils/mpesa.js`
no longer hard-blocks the STK push over a broken callback URL; it only requires the actual
credentials (Consumer Key/Secret/Shortcode/Passkey) to be set. Without a real callback URL, Daraja
has nowhere reachable to push an instant confirmation to, so this app falls back to **active
polling** (`GET /api/payments/mpesa/status/:checkoutRequestId`, which asks Daraja directly via
`stkQuery`) — payments still confirm, just via polling every few seconds instead of an instant
push. A working callback URL is faster and more resilient (works even if the browser tab closes
mid-payment), but it is not required for the app to function.

**"I got a receipt but my phone never got the STK push prompt" (most common issue)**
This is almost always **not a bug** — it's how Daraja's **sandbox** environment works:
Safaricom's sandbox only delivers a real STK push prompt to their published test number,
**254708374149**, or to numbers you've explicitly registered as test credentials in the Daraja
portal. A real personal phone number (like your own) will **not** receive anything in sandbox
mode, even though the API call itself succeeds and looks fine.

Two things now make this obvious instead of confusing:
- Every checkout/rental/event payment form shows a **"🧪 Sandbox mode"** banner with a
  **"Use test number 254708374149"** button — tap it to actually see a prompt (in the Daraja
  simulator, not a real phone — sandbox never texts a real device).
- `backend/utils/mpesa.js` now checks Daraja's `ResponseCode` after every STK push request. If
  Safaricom silently rejected the request (which used to look identical to success), you'll now
  get a clear error instead of a receipt that never confirms.
- Payment status polling now also calls `GET /api/payments/mpesa/status/:checkoutRequestId`,
  which actively re-asks Daraja for the transaction result and updates the database — so even if
  the webhook callback never arrives (e.g. no public callback URL configured), a payment that
  really did succeed won't stay stuck on "pending" forever.

**To receive real prompts on a real phone**, you need Safaricom's **production** Daraja
credentials tied to a live paybill/till number (completed through Safaricom's go-live process),
not the sandbox shortcode `174379`. Set `MPESA_ENV=production` and swap in your production
`MPESA_CONSUMER_KEY`/`SECRET`/`SHORTCODE`/`PASSKEY` when you're ready — sandbox and production
credentials are never interchangeable.

**Blank/white screen after logging in as a non-admin role**
Every page is now wrapped in a global `ErrorBoundary` (`frontend/src/components/ErrorBoundary.jsx`,
mounted in `main.jsx`) — if a component throws during render, you'll see a "Something went wrong"
screen with a **Go back home** button instead of a blank page. In development
(`import.meta.env.DEV`), the error message is shown inline too. If you still hit a blank screen:
1. Open the browser console (F12) — the real JS error will be logged there
2. Confirm you rebuilt/redeployed **after** pulling this zip — an old cached bundle can behave
   differently from the current source
3. Confirm the account's role matches what you expect (`GET /api/auth/me` while logged in, or
   check the Users tab as an admin) — `mechanic`/`staff` accounts land on `/admin` with only the
   tabs their role permits; `customer` accounts land on `/dashboard`

**Docker containers not showing as "running"**
`docker-compose.yml` now defines all three services (`postgres`, `backend`, `frontend`) instead
of just the database. Run `docker compose up -d --build` (not `docker compose up -d postgres`) to
start everything, then `docker compose ps` — `backend` and `frontend` should show `running`, and
`postgres` should show `running (healthy)` once its healthcheck passes (a few seconds after
startup). If `backend` restarts in a loop, check `docker compose logs backend` — it's almost
always a missing/placeholder `.env` value (see sections 5 and 6).

**M-Pesa STK push returns "Request failed with status code 400"**
As of this build, `backend/utils/mpesa.js` validates configuration and phone format *before*
calling Daraja, and returns a specific message instead of a generic 400/500:
- "M-Pesa is not fully configured" → one of `MPESA_CONSUMER_KEY`/`SECRET`/`SHORTCODE`/`PASSKEY`/`CALLBACK_URL` is missing or still the placeholder value from `.env.example`
- "MPESA_CALLBACK_URL must be a public https:// URL" → you're using `localhost` or `http://` — use `ngrok http 5000` and set the generated `https://` URL
- ""...is not a valid Kenyan phone number" → check the phone field format (`07XXXXXXXX` or `2547XXXXXXXX`)

If checkout still fails after fixing these, the order is **not lost** — it's saved as
`pending_payment` and a "Retry M-Pesa" button appears in the dashboard's Orders/Rentals tab.

---

## 14. Production deployment notes

1. Run `npm run seed` once after `sequelize.sync({ force: true })` — switch to Sequelize migrations for ongoing schema changes
2. Set `MPESA_ENV=production` and use production Daraja credentials
3. Put the API behind HTTPS (required by Daraja for both sandbox and production callbacks)
4. Set `NODE_ENV=production` — enables stricter TLS, disables error stack traces in responses
5. Set a strong random `JWT_SECRET` — never reuse the development value
6. Add `npm audit --audit-level=high` to your CI pipeline before deploying

---

*Built for KCA University STU701 · Elvis Muthomi (25/01220) · Supervisor: Madam Faith · 2026*
