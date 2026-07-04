# CLAUDE.md — enJoyful Life E-Commerce

## Project Overview

**enJoyful Life** is a premium skincare & lifestyle e-commerce platform built as a two-app monorepo:

- **`enjoyful_ecom/`** — Next.js 16 storefront + admin panel (this directory)
- **`enjoyful-api/`** — NestJS + MongoDB backend (sibling directory)

The storefront is currently in **pre-launch mode** behind a `ComingSoon` page. The full storefront, admin panel, and backend API are production-ready.

See **`ARCHITECTURE.md`** in this repo for the full system architecture, data model, and API surface.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16.1.6 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| 3D | Three.js |
| Backend | NestJS 11 + Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (access + refresh), httpOnly cookies |
| Images | Cloudinary CDN |
| Checkout | WhatsApp deep link (`wa.me/{phone}?text=...`) |

---

## How to run

This is a monorepo: the **`enjoyful-api/`** folder (NestJS backend) lives inside the same Git repo as the Next.js storefront. The two run as **independent Node processes** — you need both running for the storefront to show live products.

---

### Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Check |
|---|---|---|
| **Node.js** | ≥ 20 LTS | `node -v` |
| **npm** | ≥ 10 | `npm -v` |
| **NestJS CLI** (optional, for `nest` commands) | ≥ 11 | `npx @nestjs/cli --version` |

---

### Step 1 — Clone & install

```bash
# Clone the repo (one folder contains both apps)
git clone <repo-url>
cd enjoyful_ecom

# Install frontend dependencies (from project root)
npm install

# Install backend dependencies
cd enjoyful-api
npm install
cd ..
```

---

### Step 2 — Create env files

Both env files must exist before running. They are `.gitignore`d — never commit them.

**`enjoyful_ecom/.env.local`** (Next.js frontend):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEST_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WHATSAPP_NUMBER=971500000000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
# Must equal enjoyful-api's JWT_ACCESS_SECRET.
# Lets middleware.ts cryptographically verify the admin JWT.
# If unset, middleware falls back to expiry + role check only (degraded).
JWT_ACCESS_SECRET=<same-as-enjoyful-api-JWT_ACCESS_SECRET>
```

**`enjoyful_ecom/enjoyful-api/.env`** (NestJS backend):

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=<mongodb-atlas-uri>
JWT_ACCESS_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
JWT_ACCESS_EXPIRES=8h
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=<from-cloudinary-console>
CLOUDINARY_API_KEY=<from-cloudinary-console>
CLOUDINARY_API_SECRET=<from-cloudinary-console>
ADMIN_SEED_EMAIL=admin@enjoyfullife.com
ADMIN_SEED_PASSWORD=<choose-one>
BREVO_API_KEY=<from-brevo-dashboard>
BREVO_FROM_EMAIL=no-reply@yourdomain.com
BREVO_FROM_NAME=enJoyful Life
GOOGLE_CLIENT_ID=<same-as-frontend-NEXT_PUBLIC_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
```

---

### Step 3 — (First time only) Seed the database

This creates the admin account, categories, and initial products in MongoDB.

```bash
cd enjoyful-api
npx ts-node -r tsconfig-paths/register src/database/seed.ts
cd ..
```

---

### Step 4 — Run both servers

Open **two separate terminals** and run one command in each.

**Terminal 1 — Backend (NestJS on port 4000)**

```bash
cd enjoyful-api
npm run start:dev
```

Wait for this message before starting the frontend:
```
[Nest] Application is listening on port 4000
```

**Terminal 2 — Frontend (Next.js on port 3000)**

```bash
# From the project root (enjoyful_ecom/)
npm run dev
```

Wait for this message before opening the browser:
```
✓ Ready in Xms
```

---

### Step 5 — Open in browser

| URL | What it is |
|---|---|
| http://localhost:3000 | Storefront (customer-facing) |
| http://localhost:3000/admin/login | Admin panel login |
| http://localhost:4000/docs | NestJS Swagger API docs |

Default admin credentials are whatever you set in `.env` → `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.

---

### Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot connect to MongoDB` | Check `MONGODB_URI` in `enjoyful-api/.env`. Your IP must be whitelisted in MongoDB Atlas Network Access. |
| Frontend shows blank / no products | The backend must be running first. Check http://localhost:4000/docs is reachable. |
| Port already in use | Run `netstat -ano \| findstr ":3000"` (Windows) or `lsof -i :3000` (Mac/Linux) to find and kill the blocking process. |
| `nest: command not found` | Use `npx nest start --watch` instead of `nest start --watch`. |
| Admin login fails | Re-run the seed script — the admin account may not exist yet. |

---

### Other commands

```bash
# Production build (frontend)
npm run build
npm run start     # serve the production build

# Production build (backend)
cd enjoyful-api
npm run build
npm run start:prod    # serves from dist/

# Linting
npm run lint                   # frontend
cd enjoyful-api && npm run lint  # backend
```

### One-time database scripts (run from `enjoyful-api/`)

```bash
# Seed admin user + categories + 13 products + carousel placeholders
npx ts-node -r tsconfig-paths/register src/database/seed.ts

# Re-upload every product/banner/carousel image in MongoDB to the CURRENT Cloudinary account (idempotent — skips URLs already on the target cloud)
npx ts-node -r tsconfig-paths/register src/database/migrate-cloudinary.ts

# Upload local public/assets carousel + banner files to Cloudinary (first-time only)
npx ts-node -r tsconfig-paths/register src/database/upload-local-assets.ts
```

### Catalog & product-image pipeline (plain Node scripts — `node src/database/<file>.js`)

The 111-product Enjoyful Life catalog is loaded and imaged with a chain of scripts (run in this order):

```bash
# 1. Wipe products + seed all 111 SKUs from the XLSX catalog (sets category,
#    subcategory, size, productFamily, benefits, ingredients; price=0, no images)
node src/database/seed-from-excel.js

# 2. Convert local product-images/ to WebP + upload to Cloudinary (writes
#    product-data/cloudinary-urls.json). Skipped/special-char files: upload-skipped-images.js
node src/database/upload-product-images.js
node src/database/upload-skipped-images.js

# 3. Rebuild every product's image/hoverImage/images[] DIRECTLY from Cloudinary
#    folders (source of truth — exact folder→product match, no fuzzy guessing)
node src/database/rebuild-images-from-cloudinary.js

# 4. Hide products that still have no real photo (reversible from admin)
node src/database/hide-products-without-images.js
```

Product images live in Cloudinary under a category folder tree: `enjoyful/products/{category}/{subcategory}/{product}/…` — e.g. `enjoyful/products/glow/face-scrub/apricot/`, `enjoyful/products/fragrances/perfume-50ml/cuir-imperial/`. Within a folder, the file ending in `21` is the thumbnail (sorted first). `rebuild-images-from-cloudinary.js` is the authoritative re-imaging step — re-run it after adding new photos, then re-run `hide-products-without-images.js` to auto-un-hide.

### Other commands

```bash
npm run build   # production build (frontend)
npm run lint    # eslint
cd enjoyful-api && npm run build   # backend build
```

Both servers must be running for the storefront to fetch live products. The frontend falls back to static data if the API is unreachable.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                     # Minimal HTML shell (fonts, metadata, DataProvider)
│   ├── (storefront)/                  # Route group — wraps with StickyHeader/Footer/MobileBottomNav
│   │   ├── layout.tsx                 # StorefrontShell (header, footer, PageViewTracker)
│   │   ├── page.tsx                   # Homepage (HeroSection from API, Featured, etc.)
│   │   ├── about/page.tsx
│   │   ├── cart/page.tsx              # WhatsApp checkout
│   │   ├── contact/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── category/[category]/page.tsx
│   │   └── product/[id]/page.tsx      # Gallery, accordion, mobile bottom bar
│   ├── admin/                         # Standalone admin layout (no storefront chrome)
│   │   ├── layout.tsx                 # Client sidebar + mobile overlay + logout
│   │   ├── login/page.tsx             # Styled login (Lock icon, eye toggle)
│   │   ├── page.tsx                   # Dashboard — analytics widgets + quick links
│   │   ├── products/
│   │   │   ├── page.tsx               # Table + search + hide toggle + delete + view link
│   │   │   ├── ProductForm.tsx        # Shared create/edit form (image upload, list fields)
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/edit/page.tsx
│   │   │   └── bulk-import/page.tsx   # JSON paste + CSV upload with per-row error reporting
│   │   ├── users/page.tsx             # Registered users — search, sort, paginate, activate/deactivate
│   │   ├── reviews/page.tsx           # Reviews moderation — status tabs (Visible/Hidden/Deleted), hide/restore/delete
│   │   ├── carousel/page.tsx          # Slide CRUD with separate desktop + mobile uploads
│   │   └── banners/page.tsx           # Per-category banner uploads (desktop + mobile)
│   └── api/                           # Next.js route handlers — proxy to NestJS
│       ├── auth/{login,admin-login,logout,refresh,me,register}/route.ts
│       ├── products/{,[id],bulk-import,slug,quick-search}/route.ts
│       ├── categories/{,[id]}/route.ts
│       ├── cart/{,items,merge}/route.ts
│       ├── orders/{,[id],[id]/status}/route.ts
│       ├── wishlist/{,[productId]}/route.ts
│       ├── banners/{,[id],reorder}/route.ts
│       ├── media/{upload,[...publicId]}/route.ts
│       ├── track/route.ts             # POST → analytics/track (fire-and-forget)
│       └── admin/                     # Admin-specific routes that wrap API + transform data
│           ├── auth/route.ts          # Sets admin_access_token cookie
│           ├── logout/route.ts
│           ├── products/{,[id],[id]/visibility,bulk-import}/route.ts
│           ├── users/{,[id]}/route.ts # List/get/activate users (admin)
│           ├── reviews/{,[id]}/route.ts # Moderate reviews (admin: hide/show/archive/restore)
│           ├── carousel/{,[id]}/route.ts
│           ├── banners/route.ts
│           ├── upload/route.ts        # Multipart forward to /media/upload
│           └── analytics/route.ts     # GET dashboard summary (admin only)
├── components/
│   ├── layout/                        # Global chrome
│   │   ├── StickyHeader.tsx
│   │   ├── MegaMenu.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── TopOfferBar.tsx
│   │   ├── SearchOverlay.tsx          # Debounced live-results dropdown
│   │   ├── StorefrontShell.tsx        # Header + footer wrapper
│   │   ├── PageViewTracker.tsx        # Tracks page_view on route change
│   │   └── AuthModal.tsx
│   ├── sections/                      # Homepage sections
│   │   ├── HeroSection.tsx            # Fetches slides from /api/admin/carousel
│   │   ├── FeaturedProducts.tsx
│   │   ├── ShopByCategory.tsx
│   │   ├── BestSellingProducts.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── NewsletterSection.tsx
│   │   └── ComingSoon.tsx
│   └── ui/
│       ├── ProductCard.tsx            # With discount badge + analytics click tracking
│       ├── AddToCartButton.tsx        # Tracks add_to_cart
│       ├── Breadcrumb.tsx
│       └── AdminSkeleton.tsx          # Loading skeletons for admin pages
├── context/
│   └── DataContext.tsx                # Global state: products (API), cart, wishlist (localStorage)
├── data/
│   └── products.ts                    # Static fallback catalogue (used until API responds)
└── lib/
    ├── api-proxy.ts                   # Shared proxyRequest() helper
    ├── analytics.ts                   # track() — uses sendBeacon when available
    └── utils.ts                       # cn() helper
```

---

## Performance: server-side filter / sort / paginate

The category page (`/category/[category]`) used to hold all products in memory (via `DataContext`) and filter/sort/paginate client-side with a `useMemo`. That was wasteful — every keystroke or filter toggle re-ran the JS filter over the full catalogue. It also broke once the catalogue grew past a few hundred items.

It now hits the backend with every filter combination encoded in the query string:

```
GET /api/products?category=glow&minPrice=20&maxPrice=100&skinType=Oily,Dry&productType=Serum&sort=price_asc&page=2&limit=12
```

- `sort` values: `featured` (default) · `price_asc` · `price_desc` · `rating` · `newest`
- `skinType` and `productType` accept comma-separated CSVs for multi-select.
- Response shape: `{ data: Product[], meta: { page, limit, total, totalPages } }`.
- The page resets to page 1 whenever filters/sort/category/query change, shows a skeleton grid during the fetch, and renders Prev/Next pagination at the bottom.

The same pattern is used by **admin Users** (`/api/admin/users?q=&sort=&page=&limit=`), the admin **analytics dashboard**, and **reviews** (`/api/reviews/product/:id?sort=&page=&limit=`). Default page size: 12 for storefront grids, 20 for admin tables.

`DataContext.products` is still fetched once on mount (`/api/products?limit=100`) and used for: homepage sections (Featured, Best-selling), related products on the detail page, and the fallback when search/filter UI needs an immediate result before the API responds. Anything paginated or filtered queries the API directly.

---

## Product families & size variants

Each size of a product is its own SKU (its own MongoDB document) — e.g. "Almond Body Lotion 100ml" and "…350ml" are two records. SKUs that belong together share a `productFamily` slug (e.g. `almond-body-lotion`) and a `size` string (`100ml`, `350gm`).

- **Listing collapses families.** `GET /products` (`findAll` in `products.service.ts`) runs an **aggregation** that groups by `productFamily` and returns ONE representative card per family — the **lowest-price (smallest) variant** — with a `variantCount`. Products with no `productFamily` (null/empty) are never collapsed together (the group key falls back to `_id`). `total` in `meta` counts **groups**, not SKUs, so pagination is correct. The default `featured` sort and all filters are applied to the collapsed set.
- **Search collapses too.** `quickSearch` over-fetches `limit*2`, sorts cheapest-first, then dedupes by `productFamily || _id` so the overlay shows one row per product.
- **Detail page picks the size.** The product page (`product/[id]/page.tsx`) calls `GET /products/family/:family` (`findFamily`) to fetch all sibling sizes and renders a Size selector; choosing a size navigates to that SKU's page. The selector only shows when a family has 2+ variants.
- **Admin is NOT collapsed.** `findAllAdmin` (`GET /products/admin/all`) returns every SKU so each size can be edited individually.
- To set `productFamily`/`size` in bulk, the seed/patch scripts below derive them from the product name.

Products with **no real photo** are hidden from the storefront (`isHidden: true`) via `hide-products-without-images.js` — they stay in admin, ready to un-hide once photographed. The storefront `Image` fallback is `/assets/placeholder.png`.

### Subcategory filtering & promo badges

- `GET /products` accepts `subcategory` (exact, case-insensitive) on top of `category`. The top-bar mega-menu (`StickyHeader.tsx` taxonomy + `MegaMenu.tsx`) links each subcategory to `/category/{cat}?subcategory={Sub}`; the category page reads the param, filters, and shows a dismissible chip. Subcategory option lists live in two mirrored places — `StickyHeader.menuCategories` and `category/[category]/page.tsx` `SUBCATEGORIES_BY_CATEGORY` — and **must match the seeded `subcategory` values**.
- Product flags: `isFeatured` (badge "BESTSELLER"), `onSale` ("SALE"), `bestDeal` ("BEST DEAL"), plus the auto `discountPct` ("% OFF"). Toggle them per-row in `/admin/products` (optimistic, via `adminApi.updateProduct`) or in `ProductForm`. Cards render the stacked badges; the product page shows them by the price.
- `node src/database/backfill-product-details.js` fills empty presentation fields (howToUse, recommendedUsage, precautions, skinType, scent, texture, targetUse, features) with per-product-type templates — never touches real Excel `benefits`/`ingredients`/`activeIngredients`. Re-run anytime; idempotent.
- The product page renders a **Product Details specs grid** + accordions (Benefits, Active Ingredients, Features, How To Use, Full INCI, Precautions). The size selector shows per-size price and no longer disables "sold out". Cart rows + the WhatsApp message include the selected `size`.

---

## State Management

`DataContext` (`src/context/DataContext.tsx`):

- **Products** — fetched from `/api/products?limit=100` on mount; falls back to static `src/data/products.ts` on network failure. `normalizeApiProduct()` adapts MongoDB shape (`_id`, `images: [{url}]`, `category: {name}`) to the storefront `Product` interface.
- **Cart** — `CartItem[]` persisted to `localStorage` under `enjoyful-cart`. Authenticated users also sync to `/api/cart`.
- **Wishlist** — `Product[]` persisted to `localStorage` under `enjoyful-wishlist`.
- **Auth** — `isAuthenticated`, `user`, `login()`, `logout()`, `register()`. Tokens live in httpOnly cookies; mount-time check via `/api/auth/me`.

---

## Auth Flow

Three ways for customers to sign in (all converge on the same `access_token` + `refresh_token` httpOnly cookies and `User` document):

| Method | Endpoint chain | When to use |
|---|---|---|
| **Password** | `POST /api/auth/login` → NestJS `/auth/login` | Returning users with a password |
| **Email OTP** (passwordless) | `POST /api/auth/otp/request` → emails a 6-digit code via Brevo → `POST /api/auth/otp/verify` → NestJS `/auth/otp/{request,verify}` | Default for new users. Creates the account on first verify. |
| **Google** | Client gets ID token via Google Identity Services → `POST /api/auth/google` → NestJS `/auth/google` (verifies token with `oauth2.googleapis.com/tokeninfo`) | One-tap sign-in. Requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on the client and `GOOGLE_CLIENT_ID` on NestJS (audience check). |

OTP codes are 6 digits, expire in 10 minutes, max 5 wrong attempts, 60-second resend cooldown. Hashed (bcrypt) at rest. Brevo template lives in `enjoyful-api/src/modules/email/brevo.service.ts`.

The `User` schema now tracks `providers: ('password' | 'otp' | 'google')[]`, `emailVerified`, `googleSub`, `avatarUrl`. `password`, `firstName`, `lastName` are optional (default `''`) so passwordless and Google users don't need them up front.

- Admin login: `POST /api/admin/auth` → sets `admin_access_token` cookie. Admin pages read this cookie when proxying to NestJS.
- All admin pages call `/api/admin/*` routes (never NestJS directly). The admin proxy attaches the bearer token from the cookie before calling NestJS.

### Guest mode (cart + wishlist)

Cart and wishlist work without an account — both persist to `localStorage` (`enjoyful-cart`, `enjoyful-wishlist`). When the user signs in (via any method), the `mergeGuestCart()` helper in `DataContext` POSTs the local cart to `/api/cart/merge` so server-side cart picks up everything that was added as a guest. Wishlist additions/removals only sync to the server when `isAuthenticated === true`; guests just keep their localStorage copy.

### Admin: Users page

`/admin/users` lists every registered user with their auth providers (Password / Email OTP / Google badges), order count + total spent, review count, joined date, and an active/inactive toggle.

- Backend: `GET /users` (admin only) returns `{ data, meta, stats }` where `stats` is `{ totalUsers, activeUsers, adminCount, recentSignups }` (last 7 days) — drives the four stat cards at the top of the page.
- Search debounced 250ms on email/first/last name (regex, case-insensitive, regex special chars escaped).
- Sort options: `recent` · `oldest` · `name` · `orders` (orders-per-user is a post-aggregation sort).
- `PATCH /users/:id/status { isActive: boolean }` flips a user active/inactive. Admin accounts are NOT toggleable from the UI as a safety check.
- Per-user detail endpoint `GET /users/:id` returns recent orders + recent reviews — wired up but not yet rendered in a detail page.

### Admin: Reviews moderation

`/admin/reviews` — every review across the site, filterable by status with stat counts.

| Tab | Filter |
|---|---|
| **All** | every review including hidden and soft-deleted |
| **Visible** | `isApproved && !isHidden && !isDeleted` (what the storefront shows) |
| **Hidden** | `isHidden && !isDeleted` |
| **Deleted** | `isDeleted` (soft-deleted) |

Per-row actions:
- **Hide / Show** — toggles `isHidden`. Hidden reviews disappear from the storefront immediately, but the row stays in this admin list under the Hidden tab.
- **Delete** — soft-deletes (`isDeleted: true, deletedAt: now`). Disappears from the storefront and from the Hidden tab; appears under the Deleted tab where it can be **Restored**. The DB record is preserved for audit.
- Endpoints: `PATCH /reviews/:id/visibility { hidden }`, `PATCH /reviews/:id/archive { deleted }`, `DELETE /reviews/:id` (admin = soft delete, customer = hard delete of own review).

Search box filters on user name, email, title, comment (case-insensitive regex). Recomputes `product.rating` + `product.reviews` whenever a review's visibility or deletion state changes.

### Product external buy links

Each product has `externalBuyLinks: { amazon, talabat, carrefour }` where each entry is `{ url: string, visible: boolean }`. A button only renders on the storefront product detail page if **both** the URL is non-empty AND `visible: true` — so the admin can save a URL once and toggle the button on/off without losing the URL.

`ProductForm.tsx` has a "Buy elsewhere" card with one row per provider: URL input + toggle switch + live "Showing / Hidden / —" status. The storefront product page swaps the static "Also available at" decorative row for real clickable `<a target="_blank">` links to whatever providers are enabled. The whole row hides if no provider is visible.

### Reviews

Customers can leave one review per product (rating 1–5, optional title, required comment).
- `GET /reviews/product/:productId?sort=recent|highest|lowest&page&limit` — public, paginated, includes `summary { average, count, distribution }`.
- `POST /reviews` — authenticated; creates the review and recomputes `product.rating` + `product.reviews`.
- `PATCH /reviews/:id`, `DELETE /reviews/:id` — owner only (admins can delete any).
- `GET /reviews/admin/all`, `PATCH /reviews/:id/visibility` — admin moderation.

UI lives in `src/components/product/ProductReviews.tsx`, mounted on the product detail page. The "Write a review" button opens the review form for authenticated users; guests get an `AuthModal` first (titled "Sign in to leave a review"), and the form auto-opens once they finish signing in.

---

## Analytics

Client-side `track()` (`src/lib/analytics.ts`) fires events via `navigator.sendBeacon` to `/api/track`. Events captured:

| Event | Trigger |
|---|---|
| `page_view` | `PageViewTracker` on every route change |
| `product_view` | Product detail page mount |
| `product_click` | `ProductCard` link click + search overlay result click |
| `add_to_cart` | `AddToCartButton` click |
| `add_to_wishlist` | Wishlist toggle from `ProductCard` |
| `search` | Debounced 800ms after the user stops typing in `SearchOverlay` |
| `checkout_initiated` | WhatsApp checkout button on cart page |

Sessions are tracked via `sessionStorage` (`enjoyful-session` key, lifespan = browser session). The admin dashboard (`/admin`) reads aggregates via `/api/admin/analytics`.

---

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-brand-purple` | `#735697` | Primary accent, admin CTAs |
| `--color-brand-mustard` | `#F4B449` | Featured callouts |
| `--color-brand-onyx` | `#1A1A1B` | Text, borders |
| `--color-brand-sand` | `#F9F5F0` | Page backgrounds |

Typography: `--font-heading` = Montserrat, `--font-sans` = Open Sans.

---

## Environment

`.env.local` (do not commit):

```
NEST_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WHATSAPP_NUMBER=971500000000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
JWT_ACCESS_SECRET=<same-as-enjoyful-api-JWT_ACCESS_SECRET>   # admin middleware JWT verification
```

NestJS env (`enjoyful-api/.env`):
- Core: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES` (default 8h), `JWT_REFRESH_EXPIRES`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Admin seed: `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`
- Brevo email (OTP + other transactional): `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`
- Google OAuth (verifies token `aud`): `GOOGLE_CLIENT_ID`

---

## Cloudinary (image hosting)

All product / carousel / banner images live in a single Cloudinary account. Cloud name lives in `CLOUDINARY_CLOUD_NAME` (currently `dk9mwcx68`). The NestJS `MediaModule` handles uploads:

- **POST `/api/v1/media/upload`** — admin-only, multipart `file`, returns `{ url, publicId, width, height }`. Server-side uploads use the API Key + Secret from env.
- Admin pages POST to **`/api/admin/upload`** (Next.js route handler) which forwards multipart to the NestJS endpoint with the admin bearer token and normalises the response to `{ secure_url }`.
- Cloudinary transform applied on upload: `quality: auto`, `fetch_format: auto`, `width: 1200` (1600 for hero/banner), `crop: limit`.

Folder layout used by the migration / upload scripts:

```
enjoyful/
  products/{slug}/...           # product images, by slug
  carousel/...                  # hero carousel slides (desktop + mobile)
  category-banners/{Category}/  # per-category landing-page banners
```

### Switching Cloudinary accounts

If you rotate API keys or change `CLOUDINARY_CLOUD_NAME`, the URLs already in MongoDB still point at the OLD account. Re-host them by running:

```bash
cd enjoyful-api
npx ts-node -r tsconfig-paths/register src/database/migrate-cloudinary.ts
```

This script reads every product / slide / banner from MongoDB, asks the NEW Cloudinary account to fetch each old URL and re-upload it, then rewrites the document with the new URL. Idempotent — URLs already pointing at the current `CLOUDINARY_CLOUD_NAME` are skipped.

To upload local `public/assets` carousel + banner files for the first time, run `src/database/upload-local-assets.ts` (mapping is hardcoded in that file).

---

## Bulk Product Import

Admin pages: `/admin/products/bulk-import`. Two modes:

| Mode | Input | NestJS endpoint |
|---|---|---|
| **JSON** | Paste an array (or `{ products: [...] }`) into a textarea | `POST /products/bulk-import/json` |
| **CSV** | Upload a `.csv` file (header row required) | `POST /products/bulk-import/csv` |

Required per row: `name`, `category` (Glow / Baby / Daily / Fragrances / Home), `price`. Images must be hosted URLs (Cloudinary preferred). CSV uses pipe (`|`) to separate list items (`benefits`, `ingredients`, `skinType`). A third **XLSX** mode parses the Enjoyful Life INCI catalog spreadsheet and infers category/subcategory/size/active-ingredients before import.

The page includes "Copy template" + "Download sample" buttons to grab a working JSON or CSV starter. The response is rendered as `{ created, failed, errors[] }`; row-level errors show the offending row number + the rejection reason. After a successful import the admin products cache (`sessionStorage["enjoyful-admin-products-cache"]`) is invalidated so the list page refetches.

---

## Launch / Pre-launch Switch

The storefront layout currently shows a `ComingSoon` page in some configurations. The full storefront lives behind `(storefront)/` and is wired up — to launch, remove any `ComingSoon` short-circuit in `(storefront)/page.tsx` and `(storefront)/layout.tsx`.

---

## Path Aliases

`@/` → `src/` (configured in `tsconfig.json`).
