# Fashion Cart — Version 1

A production-ready e-commerce web application for a clothing shop, with
manual UPI QR payments (scan → pay → upload screenshot + UTR → admin
verifies → order confirmed).

---

## 1. Requirements

Install these before you begin:

- **Node.js** 20 or later — https://nodejs.org
- **PostgreSQL** 14 or later — https://www.postgresql.org/download/
- **Git** (optional, if you're cloning rather than extracting a ZIP)

---

## 2. Installation

```bash
# 1. Extract the project (or git clone), then move into it
cd fashion-cart

# 2. Install dependencies
npm install

# 3. Create a PostgreSQL database (see section 3 below)

# 4. Configure environment variables
cp .env.example .env
# then edit .env and set DATABASE_URL to point at your database

# 5. Run database migrations
npm run db:migrate

# 6. Seed demo data (optional but recommended for first run)
npm run db:seed

# 7. Create your first admin account
npm run create-admin

# 8. Start the development server
npm run dev
```

Then open:
- Storefront: http://localhost:3000
- Admin panel: http://localhost:3000/admin/login

> **Note on first install:** `npm install` runs `prisma generate`, which
> downloads a small Prisma query engine binary from the internet the
> first time. Make sure the machine has normal internet access during
> `npm install` and `npm run db:migrate`.

---

## 3. Database setup

Create an empty PostgreSQL database, e.g.:

```bash
# Using psql
createdb fashion_cart

# Or from inside psql
CREATE DATABASE fashion_cart;
```

Then set `DATABASE_URL` in your `.env` file:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fashion_cart"
```

Run migrations to create all tables:

```bash
npm run db:migrate
```

Seed demo categories/products (all clearly labelled `[DEMO PRODUCT]` —
replace or delete them before going live):

```bash
npm run db:seed
```

Useful extra commands:

```bash
npm run db:studio    # Visual database browser (Prisma Studio)
npm run db:deploy    # Apply migrations in production (no interactive prompts)
```

---

## 4. Admin setup

There is **no hard-coded admin password** anywhere in this codebase.
Create your first admin account interactively:

```bash
npm run create-admin
```

You'll be prompted for a name, email, and password. Running this again
with an existing customer email promotes that account to admin and
resets its password — useful for recovery.

Log in at `/admin/login`. Admin login is completely separate from the
customer login flow; a customer account cannot access `/admin/*` pages.

---

## 5. Running the application

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

Run tests:

```bash
npm test
```

---

## 6. Uploaded files

Product images, payment screenshots, and generated invoice PDFs are
stored under `uploads/` (outside the Next.js static `public/` folder,
and served through an authenticated route — see `app/uploads/[...path]/route.ts`).
Payment screenshots are only ever served to the order's owner or an
admin.

For production, back this directory up regularly, or point it at
mounted network/object storage — see section 8.

---

## 7. Production deployment

Your personal PC is fine for **development**, but is not a substitute
for a proper production environment. Before going live:

- Run PostgreSQL on a managed or backed-up server (not your dev machine).
- Set `NODE_ENV=production` and use `npm run build && npm run start`,
  or deploy to a Node.js-capable host (a VPS, or a platform like
  Railway/Render/Fly.io that supports Next.js + PostgreSQL).
- Put the app behind HTTPS (e.g. via a reverse proxy like Nginx/Caddy,
  or your hosting platform's built-in TLS).
- Set real values in `.env` — **never commit `.env` to Git**.
- Take regular PostgreSQL backups (`pg_dump`) and store `uploads/`
  backups separately, ideally on object storage (S3-compatible, etc.).
- Review `.gitignore` to confirm `.env`, `uploads/`, and `node_modules/`
  are excluded before pushing to any Git remote.

### Moving file storage to the cloud later

`lib/upload.ts` is the single place that decides where files are
written. To move to S3/Cloudinary/etc. later, replace its
`saveImageUpload` implementation with a cloud SDK call and return the
resulting URL — nothing else in the app needs to change, since every
caller only depends on the returned path/URL.

### Adding an automatic payment gateway later (Version 2)

The `Payment` model already has a `method` field (`MANUAL_UPI` today,
`ONLINE_GATEWAY` reserved for later) and order creation
(`lib/orders/create-order.ts`) is decoupled from how payment is
collected. To add a gateway: create a new payment-collection route
that creates a `Payment` row with `method = ONLINE_GATEWAY`, verifies
the gateway's webhook/callback, and flips it to `VERIFIED` the same
way `app/api/admin/payments/[id]/approve/route.ts` does today — no
changes are needed to cart, checkout, inventory, or invoicing.

---

## 8. Admin / shop owner guide

### Add a product

1. Admin → **Products** → **+ Add Product**
2. Fill in name, category, brand, fabric, description → Save
3. On the next screen, add **variants** (SKU, colour, size, price,
   stock) — a clothing product should almost always have more than one
   variant (e.g. Blue/M, Blue/L, Red/M…)
4. Upload one or more **images**

### Change the payment QR code

1. Admin → **Settings** → Payment Settings
2. Upload a new QR code image, optionally set a UPI ID and custom
   instructions → **Save**
3. The storefront's payment page always shows the currently active QR.

### Verify a payment

1. Admin → **Payments** (or from the Dashboard's "Pending Payment
   Verification" list)
2. Open the order → check the amount, the UTR number, and the
   uploaded screenshot
3. **Approve Payment** to confirm the order and generate its invoice,
   or **Reject Payment** with an optional reason — the customer will
   be able to resubmit.

> A customer uploading a screenshot **never** confirms an order by
> itself — only an authenticated admin approving it does. This is
> enforced in the API, not just the UI.

### Process an order

Once payment is verified, move it through: Confirmed → Processing →
Packed → Shipped → Delivered, from the order detail page's status
dropdown. The customer sees this reflected as a tracking timeline on
their own order page.

### Manage inventory

Admin → **Inventory** shows every variant's stock with an
`IN STOCK` / `LOW STOCK` (≤5) / `OUT OF STOCK` badge. Stock can be
edited inline; every manual change and every sale is recorded in the
`InventoryTransaction` table so stock history stays auditable.

---

## 9. Project structure

```
fashion-cart/
├── app/
│   ├── (shop)/          Customer-facing pages (home, shop, product, cart, checkout, account…)
│   ├── admin/
│   │   ├── login/       Admin login (outside the auth guard)
│   │   └── (protected)/ Everything else under /admin, guarded by lib/auth/session.ts
│   ├── api/              REST API routes (auth, products, cart, orders, payments, admin/*…)
│   └── uploads/[...path] Authenticated file-serving route for uploads/
├── components/            Shared React components (customer, account, admin, products)
├── lib/
│   ├── auth/              Password hashing, session management
│   ├── orders/             Server-authoritative order creation (create-order.ts)
│   ├── inventory/          Stock locking + adjustment helpers
│   ├── invoice/             PDF invoice generation
│   ├── payments/            (reserved for future gateway abstraction)
│   ├── validation/          Zod schemas
│   └── upload.ts             Secure file upload handling
├── prisma/
│   ├── schema.prisma        Full data model
│   ├── seed.ts                Demo data (clearly marked as demo)
│   └── migrations/
├── scripts/
│   └── create-admin.ts      Interactive first-admin setup
├── tests/                    Unit tests + integration test checklist
└── uploads/                  Runtime file storage (product images, screenshots, invoices)
```

---

## 10. Security notes

- Passwords are hashed with bcrypt (12 rounds); plain-text passwords
  are never stored.
- Sessions are random 256-bit tokens; only their SHA-256 hash is
  stored in the database.
- Login/registration endpoints are rate-limited per IP and per email.
- All prices, discounts, and totals are calculated server-side from
  the database on every order — nothing from the client is trusted.
- Stock is decremented with an atomic conditional update so concurrent
  checkouts can never oversell a variant.
- Uploaded files are validated by MIME type **and** file signature
  (magic bytes), size-limited, and saved under server-generated random
  filenames — the original filename is never trusted or executed.
- Only an authenticated admin can move a payment to `VERIFIED` or an
  order to `CONFIRMED`.
- Admin API routes check the caller's session role server-side on
  every request, not just in the UI.

If you find a security issue, please review it privately before
disclosing publicly.
