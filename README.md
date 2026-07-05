# enJoyful Life — E-Commerc


A premium skincare & lifestyle e-commerce platform with a Next.js storefront, an admin panel, and a NestJS + MongoDB backend in a single repo

```
enjoyful_ecom/         ← Next.js 16 storefront + admin (this repo's root)
  enjoyful-api/        ← NestJS 11 backend (subfolder, separate process)
```

> Deep documentation lives in [CLAUDE.md](./CLAUDE.md). High-level system architecture in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Tech stack

| Layer | Tool |
|---|---|
| Storefront / admin | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 |
| Styling | Tailwind CSS v4 · Framer Motion 12 · Lucide icons |
| Backend | NestJS 11 · Mongoose · MongoDB Atlas |
| Auth | JWT (8h access + 7d refresh) · httpOnly cookies · Email OTP · Google OAuth |
| Email | Brevo transactional API |
| Images | Cloudinary (server upload + crop/rotate/zoom editor) |
| Checkout | WhatsApp deep link |
| Hosting | Designed for Vercel (frontend) + any Node host (backend) |

---

## Quick start

### 1. Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (or any MongoDB instance)
- A Cloudinary account (for image hosting)
- A Brevo account (for transactional email)
- A Google Cloud OAuth Web Client (for Google sign-in)

### 2. Install

```bash
# Clone
git clone https://github.com/nabeelpp2002/enjoyful_ecom.git
cd enjoyful_ecom

# Frontend deps
npm install

# Backend deps
cd enjoyful-api && npm install && cd ..
```

### 3. Environment files

Create **`.env.local`** at the repo root (Next.js):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEST_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WHATSAPP_NUMBER=971500000000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-web-client-id>
```

Create **`enjoyful-api/.env`** (NestJS):

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=<your-mongodb-atlas-uri>

JWT_ACCESS_SECRET=<random-32+-char-string>
JWT_REFRESH_SECRET=<another-random-string>
JWT_ACCESS_EXPIRES=8h
JWT_REFRESH_EXPIRES=7d

FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=<from-cloudinary-console>
CLOUDINARY_API_KEY=<from-cloudinary-console>
CLOUDINARY_API_SECRET=<from-cloudinary-console>

BREVO_API_KEY=<from-brevo-dashboard>
BREVO_FROM_EMAIL=no-reply@yourdomain.com
BREVO_FROM_NAME=enJoyful Life

GOOGLE_CLIENT_ID=<same-as-frontend-NEXT_PUBLIC_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_PASSWORD=<set-a-strong-one>
```

Both files are gitignored.

### 4. Seed the database (one-time)

```bash
cd enjoyful-api
npx ts-node -r tsconfig-paths/register src/database/seed.ts
```

This creates the admin user, 4 categories (Glow / Baby / Daily / Home), 13 sample products with images, and 3 carousel slide placeholders. It's idempotent — safe to re-run.

### 5. Run locally

Two terminals.

```bash
# Terminal 1 — backend on :4000
cd enjoyful-api
npm run start:dev

# Terminal 2 — frontend on :3000
npm run dev
```

| URL | What |
|---|---|
| http://localhost:3000 | Storefront |
| http://localhost:3000/admin/login | Admin panel |
| http://localhost:4000/api/v1 | API base |
| http://localhost:4000/docs | Swagger UI |

Log in to the admin panel using `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.

---

## What's inside

### Storefront

- Live product catalogue from MongoDB (with static fallback if the API is down)
- Category pages with **server-side** filter / sort / pagination (skin type CSV multi-select, price range, product type, recent / price / rating)
- Product detail page: gallery, variants, "Also available at" buttons that link to Amazon / Talabat / Carrefour when the admin has set them
- **Reviews** — 1-to-5 stars + title + comment, one per (user, product). Logged-in users can edit or delete their own review.
- **Cart & wishlist** work as a guest (localStorage). On sign-in the guest cart is merged with the server-side cart.
- **Search overlay** with 150ms debounce + abortable in-flight requests against `/products/quick-search`
- WhatsApp checkout — final order is `wa.me/<phone>?text=<formatted-order>`
- Analytics: `page_view`, `product_view`, `product_click`, `add_to_cart`, `add_to_wishlist`, `search`, `checkout_initiated`, sent via `navigator.sendBeacon` so they survive navigation

### Admin panel (`/admin`)

| Page | What you can do |
|---|---|
| **Dashboard** | 8 stat cards with WoW deltas (visitors, page views, clicks, cart adds, etc.), activity sparkline, top viewed / clicked / cart-added products, top search queries, device breakdown |
| **Products** | Searchable table with hide/show toggle, edit, delete (soft), instant edit via sessionStorage cache. Bulk import via JSON paste or CSV upload. |
| **Users** | All registered users — provider badges (Password / Email OTP / Google), order count + total spend, review count, activate/deactivate |
| **Reviews** | Status tabs: All / Visible / Hidden / Deleted. Per-row Hide/Show + Soft-delete/Restore. Admin "Delete" is soft (kept in DB); customer deletes their own review = hard delete. |
| **Carousel** | Slide CRUD with separate desktop (16:9) + mobile (3:4) image uploads. Crop/rotate/zoom inside the upload modal. |
| **Banners** | Per-category (Glow / Baby / Daily / Home) desktop + mobile banner images with the same crop editor |

### Auth

Three sign-in methods, all on the same modal:

1. **Email + Password** (classic)
2. **Email OTP** — request a 6-digit code → enter to sign in. Codes are bcrypt-hashed, 10 min TTL, 60s resend cooldown, 5-attempt cap. Sent via Brevo.
3. **Google** — Google Identity Services button. Backend verifies the ID token via Google's tokeninfo endpoint and matches `aud === GOOGLE_CLIENT_ID`.

Users created via OTP or Google are *passwordless* — they have no `password` set and can't sign in via the password form unless they later set one. Account state tracks all `providers[]` used.

Cart and wishlist work fully without an account.

### Images

The admin **ImageEditor** modal sits between "pick file" and "Cloudinary upload":

- Crop to aspect (1:1 products, 16:9 carousel desktop, 3:4 carousel/banner mobile)
- Rotate (0/90/180/270° quick buttons + free dial)
- Flip horizontal/vertical
- Zoom 1× → 4×

Cropped JPEG (0.92 quality) goes to Cloudinary; the returned secure URL is what's saved to MongoDB.

---

## Useful scripts

All under `enjoyful-api/`:

```bash
# Re-upload every product/banner/carousel image in MongoDB to the
# CURRENT Cloudinary account. Idempotent — URLs already on the
# target cloud are skipped. Useful after rotating credentials.
npx ts-node -r tsconfig-paths/register src/database/migrate-cloudinary.ts

# Upload local public/assets/*.png|webp|jpg files to Cloudinary
# and wire them into Slide + CategoryBanner docs. First-time only.
npx ts-node -r tsconfig-paths/register src/database/upload-local-assets.ts
```

---

## Project layout (high level)

```
enjoyful_ecom/
├── src/
│   ├── app/
│   │   ├── (storefront)/               # Customer-facing pages
│   │   ├── admin/                      # Admin panel (separate layout)
│   │   └── api/                        # Next.js route handlers — proxy to NestJS
│   ├── components/
│   │   ├── admin/                      # ImageEditor + other admin UI
│   │   ├── layout/                     # Header, footer, SearchOverlay, AuthModal
│   │   ├── sections/                   # Homepage sections
│   │   └── product/                    # ProductReviews + related
│   ├── context/DataContext.tsx         # Global state (products, cart, wishlist, auth)
│   └── lib/                            # Helpers
├── enjoyful-api/
│   └── src/
│       ├── modules/
│       │   ├── auth/                   # Password + OTP + Google + JWT
│       │   ├── email/                  # Brevo wrapper
│       │   ├── products/               # Catalog + bulk import + search
│       │   ├── categories/             # 4-category taxonomy
│       │   ├── reviews/                # CRUD + admin moderation
│       │   ├── users/                  # Admin users API
│       │   ├── orders/                 # Order placement
│       │   ├── cart/   wishlist/       # Server-side carts
│       │   ├── media/                  # Cloudinary upload/delete
│       │   ├── carousel/  banners/  category-banners/
│       │   └── analytics/              # Event ingest + dashboard pipeline
│       └── database/
│           ├── seed.ts
│           ├── migrate-cloudinary.ts
│           └── upload-local-assets.ts
├── public/                             # Storefront static assets
├── CLAUDE.md                           # Full developer reference
├── ARCHITECTURE.md                     # System diagram + data model
└── README.md                           # ← you are here
```

---

## Production

```bash
# Frontend
npm run build
npm run start          # serve the built Next.js app

# Backend
cd enjoyful-api
npm run build
npm run start:prod
```

For production deploys: set `NODE_ENV=production` on the backend (cookies become `secure: true`), point `FRONTEND_URL` and `NEST_API_URL` to real domains, and rotate every `*_SECRET` and `*_API_KEY` from this repo's seed values.

---

## License

Proprietary — enJoyful Life. All rights reserved.
