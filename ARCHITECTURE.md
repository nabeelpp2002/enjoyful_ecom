# enJoyful Life — System Architecture

End-to-end reference for the platform. Read this before touching cross-cutting code (auth, analytics, data flow). For day-to-day repo conventions, see `CLAUDE.md`.

---

## Topology

```
                 ┌──────────────────────────────┐
                 │       Browser (React)        │
                 │  Storefront + Admin Panel    │
                 └──────────────┬───────────────┘
                                │  fetch  (cookies)
                                ▼
                 ┌──────────────────────────────┐
                 │  Next.js 16 App Router (3000)│
                 │  ─────────────────────────── │
                 │  • Pages (storefront/admin)  │
                 │  • /api/* route handlers     │  ◄── httpOnly cookie store
                 │    (proxy + cookie + auth)   │      (access_token,
                 │  • sendBeacon → /api/track   │       refresh_token,
                 └──────────────┬───────────────┘       admin_access_token)
                                │  Bearer <token>
                                ▼
                 ┌──────────────────────────────┐
                 │      NestJS API (4000)       │
                 │  ─────────────────────────── │
                 │  Helmet · Throttler · CORS   │
                 │  JWT global guard            │
                 │  /api/v1 prefix · Swagger    │
                 └──────────────┬───────────────┘
                                │
            ┌───────────────────┼──────────────────────────┐
            ▼                   ▼                          ▼
   ┌─────────────────┐ ┌──────────────────┐ ┌───────────────────────┐
   │ MongoDB Atlas   │ │ Cloudinary CDN   │ │ WhatsApp deep link    │
   │ (Mongoose)      │ │ (image storage)  │ │ (no checkout service) │
   └─────────────────┘ └──────────────────┘ └───────────────────────┘
```

Two independent Node processes; nothing is shared at the language level. The browser never talks to NestJS directly — every backend call goes through a Next.js route handler so cookies and auth headers stay server-side.

---

## NestJS Modules

| Module | Responsibility | Public endpoints |
|---|---|---|
| **AuthModule** | JWT issue/rotate, bcrypt password hashing, refresh-token rotation | `POST /auth/{register,login,admin/login,refresh,logout}`, `GET /auth/me` |
| **CategoriesModule** | 4-category taxonomy (Glow, Baby, Daily, Home), tintColor, slug | `GET /categories`, `GET /categories/:slug`, admin CRUD |
| **ProductsModule** | Catalogue, search, soft-delete, visibility toggle, bulk-import | `GET /products`, `GET /products/quick-search`, `GET /products/slug/:slug`, `GET /products/admin/all`, admin CRUD, `PATCH /products/:id/visibility` |
| **BannersModule** | Slotted promotional banners (hero / category-top / mid / popup) | `GET /banners`, admin CRUD + reorder |
| **CategoryBannersModule** | Per-category desktop + mobile imagery (Glow / Baby / Daily / Home) | `GET /category-banners`, `POST /category-banners` (admin upsert) |
| **CarouselModule** | Homepage hero slides with separate desktop + mobile images | `GET /carousel`, admin POST / PUT / DELETE |
| **CartModule** | Server-side cart for authenticated users, guest merge on login | `GET/POST/DELETE /cart`, `POST /cart/merge` |
| **WishlistModule** | Authenticated wishlist sync | `GET /wishlist`, `POST/DELETE /wishlist/:productId` |
| **OrdersModule** | Order placement, status workflow, snapshot pricing | `POST /orders`, `GET /orders`, `PATCH /orders/:id/status` |
| **MediaModule** | Cloudinary upload + delete | `POST /media/upload`, `DELETE /media/:publicId` |
| **AnalyticsModule** | Event ingestion + dashboard aggregation pipelines | `POST /analytics/track` (public), `GET /analytics/dashboard` (admin) |

Global pieces (`src/common/`): `JwtAuthGuard` (registered as `APP_GUARD`), `RolesGuard`, `ResponseInterceptor` (wraps every response as `{success, data, meta?}`), `HttpExceptionFilter` (normalises errors), `ParseObjectIdPipe`, `sanitize.middleware`.

`main.ts` enables: `helmet()`, `cookieParser()`, CORS (origin from `FRONTEND_URL`), `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true, transform: true`), global prefix `api/v1`, Swagger at `/docs`.

---

## Data Model (MongoDB)

### `User`
`email` (unique, lower) · `password` (bcrypt, select:false) · `refreshToken` (hashed, select:false) · `role` (`customer | admin`) · `addresses[]` · `isActive`.

### `Category`
`name` · `slug` (unique) · `tintColor` · `sortOrder` · `isActive`.

### `Product`
`name` · `slug` (unique) · `description` · `category` (ObjectId ref) · `subcategory` · `productType` · `price` · `originalPrice` · `discountPct` · `currency` · `images: [{url, publicId, alt, isPrimary}]` · `image` · `hoverImage` · `rating` · `reviews` · `benefits[]` · `ingredients[]` · `howToUse` · `skinType[]` · `tags[]` · `highlights[]` · `suitableFor[]` · `tagline` · `brand` · `stock` · `isFeatured` · `isActive` · `isHidden` · `deletedAt`.

Indexes: `text(name, description, tags)`, `{category, isActive}`, `{slug}`, `{deletedAt}`.

### `Slide` (carousel)
`title` · `subtitle` · `description` · `buttonText` · `buttonLink` · `desktopImageUrl` · `mobileImageUrl` · `imageUrl` (legacy) · `order` · `isActive`. Indexes: `{order}`, `{isActive, order}`.

### `Banner` (slotted)
`slot` enum · `title` · `subtitle` · `image: {desktop, mobile}` · `ctaText/Url` · `isActive` · `sortOrder` · `scheduleStart/End`.

### `CategoryBanner`
`category` (enum, unique) · `desktopImageUrl` · `mobileImageUrl`.

### `Cart`
One per user. `items: [{product, quantity, priceSnapshot, nameSnapshot, imageSnapshot}]`.

### `Wishlist`
`user` (unique) · `products: [ObjectId]`.

### `Order`
`orderNumber` (EJL-YYYYMMDD-NNNN) · `user` · `items[]` (snapshotted) · `shippingAddress` · `subtotal/shipping/total` · `status` · `paymentStatus`.

### `Event` (analytics)
`type` (enum) · `sessionId` · `productId` (ref, nullable) · `productName` · `path` · `query` · `referrer` · `userAgent` · `device` · `metadata`. Indexes: `{createdAt: -1}`, `{type, createdAt: -1}`, `{productId, type}`.

---

## Request Lifecycle

### Storefront read (e.g. product card click)
1. Browser → `GET /product/walnut-face-scrub` (Next.js page)
2. Page reads from `DataContext`, which already fetched `/api/products?limit=100` on mount
3. `useEffect` fires `track({ type: 'product_view', ... })` → `navigator.sendBeacon('/api/track', ...)`
4. `/api/track/route.ts` forwards to NestJS `POST /analytics/track`, returns `{ok:true}` immediately (fire-and-forget)
5. NestJS persists an `Event` document with the session ID + product reference

### Admin write (e.g. create product)
1. Admin submits ProductForm → `POST /api/admin/products`
2. Next.js handler reads `admin_access_token` cookie → forwards body with `Authorization: Bearer <token>` to `POST /api/v1/products`
3. NestJS `JwtAuthGuard` + `RolesGuard` check `role === 'admin'` from JWT payload
4. `ProductsService.create()` resolves category by name, generates a unique slug, normalises `images: string[]` to `[{url, isPrimary, alt, publicId}]`, persists
5. Response wrapped by `ResponseInterceptor` as `{success: true, data: {...}}`

### Admin dashboard
1. `/admin` page mounts → `GET /api/admin/analytics?days=7`
2. Next.js handler attaches admin token → calls NestJS `GET /analytics/dashboard?days=7`
3. `AnalyticsService.dashboard()` runs **9 aggregations in parallel** (`Promise.all`): event counts × 2 windows, unique visitors × 2, top viewed / clicked / cart adds, top searches, daily time series, device breakdown, recent events
4. Returns a single JSON payload the dashboard renders into stat cards, mini chart, and top-N lists

---

## Performance & Caching

| Optimisation | Where |
|---|---|
| Pagination | `GET /products` accepts `page`, `limit`, returns `meta: {page, limit, total, totalPages}` |
| Lean queries | All read endpoints call `.lean()` — skips Mongoose document hydration |
| Indexes | Compound indexes on `{category, isActive}`, `{deletedAt}`, `{type, createdAt}` for analytics |
| Debounced search | `SearchOverlay` waits 150ms after last keystroke before issuing the request; previous in-flight requests are cancelled via `AbortController` |
| Parallel aggregations | Dashboard runs all stats in `Promise.all` to keep TTFB low |
| `cache: 'no-store'` on admin routes | Admin pages always see fresh data |
| Cloudinary `f_auto,q_auto` | Format + quality auto-negotiated per client |
| `sendBeacon` for analytics | Survives page unload, never blocks navigation |
| `next/image` with explicit `sizes` | Responsive srcset, hosts whitelisted in `next.config.ts` |
| Soft delete | Products are never hard-deleted — kept for analytics referential integrity |

---

## Security Notes

- `ValidationPipe`: `whitelist + forbidNonWhitelisted` — rejects any field not in the DTO. All admin proxy routes strip transient fields (e.g. `sizes`) before forwarding.
- Tokens never touch JavaScript. Access + refresh + admin tokens are all `httpOnly, sameSite: lax`.
- `JwtAuthGuard` is registered globally — every endpoint is protected unless decorated with `@Public()`.
- `RolesGuard` reads `req.user.role` and matches `@Roles('admin')`.
- `sanitize.middleware.ts` strips `$` and `.` from request body keys (NoSQL injection guard).
- Helmet + CORS allowlisted to `FRONTEND_URL` only.
- Login throttled at 10 / 15min via `@nestjs/throttler`.

---

## Admin Panel Capabilities

| Page | Features |
|---|---|
| `/admin/login` | Email + password, eye toggle, animated error, sets `admin_access_token` cookie |
| `/admin` | Date-range selector (1d / 7d / 30d / 90d). 8 stat cards with WoW deltas: visitors, page views, product views, clicks, cart adds, wishlist adds, searches, checkouts. Activity sparkline. Conversion rates (view→click, view→cart). Device breakdown. Top viewed / clicked / cart products. Top search queries |
| `/admin/products` | Searchable table. Per-row visibility toggle (`isHidden`, optimistic update + revert on error). Delete with loading state. Mobile collapse |
| `/admin/products/new` and `/admin/products/[id]/edit` | Shared ProductForm: image upload (Cloudinary, first = primary), categories + subcategories, pricing (price + originalPrice), benefits / ingredients / highlights / suitableFor list editors, description + howToUse |
| `/admin/carousel` | Add + edit slides via modal. **Separate desktop (16:9) and mobile (3:4) image upload** with previews. Per-slide active toggle, reorder via `order` field, delete |
| `/admin/banners` | Per-category cards (Glow / Baby / Daily / Home). Separate desktop + mobile image upload per category. Save button per card |

---

## Adding a New Feature

1. **Backend**: add a Mongoose schema → service → controller → module → register in `app.module.ts`. Use the existing DTOs/decorators (`@Public`, `@Roles('admin')`, `ParseObjectIdPipe`).
2. **Proxy**: create `src/app/api/<feature>/route.ts` in Next.js. Use `proxyRequest` from `@/lib/api-proxy` for public endpoints; copy the admin pattern (read `admin_access_token` cookie) for admin endpoints.
3. **UI**: build the page under `(storefront)/` for customer-facing or `admin/` for backoffice. Reuse `ProductCard`, `AdminSkeleton`, `track()`.
4. **Analytics**: if the action is meaningful, add a new `EventType` in `enjoyful-api/src/modules/analytics/schemas/event.schema.ts` and call `track({ type: '...' })` from the UI.
5. **Docs**: update `CLAUDE.md` (structure) and this file (architecture).

---

## Common Operations

```bash
# Reseed (clears + re-inserts 13 products)
cd enjoyful-api && npx ts-node -r tsconfig-paths/register src/database/seed.ts

# Run both servers
cd enjoyful-api && npm run start:dev          # terminal 1
cd enjoyful_ecom && npm run dev                # terminal 2

# Inspect API
curl http://localhost:4000/api/v1/products?limit=2
curl http://localhost:4000/api/v1/products/quick-search?q=walnut
open http://localhost:4000/docs                # Swagger UI

# Track a synthetic event
curl -X POST http://localhost:4000/api/v1/analytics/track \
  -H 'Content-Type: application/json' \
  -d '{"type":"product_view","sessionId":"test","productId":"6a0c..."}'
```
