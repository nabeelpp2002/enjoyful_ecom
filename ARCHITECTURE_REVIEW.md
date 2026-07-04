# Enjoyful Life — Complete Architecture Review & Optimization Roadmap

> **Date:** 2026-06-02 · **Scope:** Full platform — Next.js 16 storefront + admin, NestJS 11 + MongoDB API, Cloudinary, WhatsApp checkout.
> **Method:** 9 specialist reviewers audited the real code in parallel (~129 findings), consolidated here.
> This document is the answer to the 12 requested deliverables. Detailed per-dimension findings are in the [Appendix](#appendix--full-findings-by-dimension).

---

## Maturity Scorecard

| Dimension | Score /10 | Verdict |
|---|---|---|
| Overall Architecture & Structure | 7 | Strong — clean modular NestJS, justified proxy boundary |
| Customer-facing Storefront | 7 | Strong — polished, accessible, server-side pagination |
| Backend API / NestJS Design | 6 | Good fundamentals, inconsistent conventions |
| Database & Data Modeling | 6 | Solid schemas, **missing indexes & integrity guards** |
| Cross-cutting Code Quality / Tech Debt | 6 | Good structure, heavy proxy-layer duplication |
| Security, Auth & Access Control | 5 | **Live exposure — leaked secrets, forgeable JWT** |
| Admin Panel & Enterprise Gap | 4 | CRUD-grade, not operations-grade |
| Performance, Caching & Scalability | 4 | No caching layer, won't scale past current catalog |
| Testing, Observability & CI/CD | 4 | **No tests, no CI/CD, no error tracking** |
| **Weighted overall** | **~5.3** | Sound MVP storefront, not yet a business-operations platform |

---

## 1. Architecture Review (Deliverable #1)

**What this is today:** A well-architected two-app repo. NestJS exposes 13 feature modules (auth, products, cart, orders, reviews, analytics, banners, carousel, categories, category-banners, email, media, users, wishlist), each with clean service/controller/schema/DTO layering, a global JWT guard with `@Public()` bypass, a global `HttpExceptionFilter`, a `ResponseInterceptor` for shape consistency, and `class-validator` DTOs. The Next.js app hosts both the storefront `(storefront)` route group and the `/admin` panel, and proxies all data calls to NestJS through ~48 `route.ts` handlers.

**The proxy pattern — keep it.** Browser → Next route handler → NestJS is a deliberate boundary: it keeps JWTs in httpOnly cookies server-side so the React bundle never touches a Bearer token. That's the correct security trade-off. The problem isn't the pattern, it's that the 48 routes are hand-written copies of the same boilerplate (see #2).

**Strengths worth preserving:** security-first cookie/guard design, soft-delete with audit trail, product-family-collapsing aggregations, snapshotted order pricing, documented architecture (`ARCHITECTURE.md` / `CLAUDE.md`), bulk import (JSON/CSV/XLSX).

**The strategic gap:** This is a strong *front of house* (browse, cart, product, checkout-to-WhatsApp). The *back of house* an eCommerce business runs on — inventory, refunds, coupons, audit logs, tests, CI/CD, caching, observability — is thin or absent.

---

## 2. Identified Issues & Bottlenecks (Deliverable #2)

### 🔴 Critical (drop everything)

| # | Issue | Location |
|---|---|---|
| C1 | **Production secrets committed to version-controlled `.env`** (MongoDB URI, JWT secrets, API keys, admin password) | `enjoyful-api/.env` |
| C2 | **Weak JWT secrets → tokens are forgeable** | `auth.service.ts`, `.env` |
| C3 | **Orders created with no stock/price/active re-validation, no DB transaction** — overselling, price fraud, partial-write corruption | `orders.service.ts:20-68` |
| C4 | **No product variant / SKU / stock management** — can't run a real catalog | admin products + API |
| C5 | **No order lifecycle** (refunds, returns, RMA) | admin orders |
| C6 | **Zero production test coverage** (only stub specs) | both apps |
| C7 | **No CI/CD, no staging/prod separation, no Dockerfile** | repo root |

### 🟠 High (next)

- **Admin middleware checks cookie *presence*, not validity** → an expired cookie still grants `/admin` (`src/middleware.ts:6-12`). Pairs with C1/C2 into full store takeover.
- **No CSRF protection**; admin cookies are `SameSite=lax` not `strict`.
- **No brute-force / account-lockout** on login/OTP/refresh; weak admin seed password; no password-strength rules.
- **No MFA** for admin accounts.
- **No RBAC** beyond a single `admin` role — no staff permissions, no audit log.
- **Missing DB indexes**: `Category.slug/name`, `Product.price/rating/createdAt`, `User/Review.createdAt`, analytics `createdAt` → collection scans at scale.
- **Cart stores stale product snapshots indefinitely**; no checkout re-validation.
- **No HTTP caching** — every API route is `cache: 'no-store'`; **no Redis/CDN**; storefront fetches the whole catalog on mount.
- **No structured logging, no Sentry, no health checks** — you can't see prod failures.
- **Silent error suppression** in `DataContext` and category page; **contact form posts via `alert()`**, not a backend.

### 🟡 Medium / 🟢 Low
~100 further findings (pagination shape inconsistency, unvalidated enums, regex search, image optimization, a11y labels, duplication). Full list in the [Appendix](#appendix--full-findings-by-dimension).

---

## 3. Refactoring Strategy (Deliverable #3)

### Phase 0 — Stop the Bleeding (days)
Eliminate live security exposure and data-corruption paths before any feature work.
- **Secrets/auth:** rotate everything → purge `.env` from VCS → strong 32-byte JWT secrets → force re-login → harden admin middleware to *verify* token signature/expiry/role → add `isActive` check on refresh → `SameSite=strict` + CSRF/Origin checks on admin.
- **Order integrity:** server-side re-validation (deletedAt/isActive/stock) + recompute total + Mongoose transaction wrapping order-create & cart-clear; `UpdateStatusDto` with `@IsIn([...])`; validate `categoryId`/`product`/`user` existence in create paths.
- **Config safety:** boot-time env validation (Joi/Zod) + `/health` checks (Mongo, Cloudinary, Brevo).

### Phase 1 — Foundation (weeks)
Shared abstractions + performance baseline + a test/CI safety net.
- **DRY:** proxy-route factory (48 → ~8 files); shared `API_BASE`, `getAdminToken()`, `STORAGE_KEYS`, `AUTH_CONFIG`, cookie-TTL constants; one `normalizeMongo()`/`product-mapper.ts`; `PaginatedResponse<T>` DTO + `PaginationQueryPipe` (max 100); standardize NotFound-vs-empty semantics.
- **Shared types:** extract NestJS DTOs into a shared package (or `openapi-typescript`) consumed by Next.js to kill schema drift.
- **Perf baseline:** all missing indexes; regex search → MongoDB `$text`; Mongoose pool + slow-query profiler.
- **Caching:** `revalidate`/`Cache-Control` + ISR on public routes; Redis cache-aside for hot data with on-write invalidation.
- **Tests + CI/CD:** `mongodb-memory-server` + `supertest` integration suites (auth/orders/cart); GitHub Actions (lint/typecheck/test:cov); Dockerfiles + compose; husky pre-commit.
- **Observability:** Winston/Pino structured logs + request middleware; Sentry on both apps wired into `HttpExceptionFilter`; soft-delete Mongoose plugin to auto-apply `{deletedAt:null}`.

### Phase 2 — Admin Enterprise Build-Out (quarter)
Turn CRUD into a business-operations console: inventory & variants → order lifecycle (refunds/returns/tax) → **RBAC + audit log + admin MFA** → bulk actions, reusable `Pagination`/`AdminInput`, image-gallery UI, draft/publish.

### Phase 3 — Scale & Advanced (quarter+)
Marketing engine (coupons, gift cards, abandoned-cart, campaigns) → scale infra (CDN/edge, read replicas, BullMQ queues, cached analytics, Algolia/Elasticsearch) → optional multi-vendor, i18n/multi-currency, webhooks, real-time admin.

---

## 4. Optimized Folder Structure (Deliverable #4)

Adopt a **pnpm workspace / Turborepo monorepo** so the two apps share types and config instead of drifting:

```
enjoyful/
├─ apps/
│  ├─ web/                      # Next.js storefront + admin
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ (storefront)/    # public routes
│  │     │  ├─ admin/           # admin routes (guarded by middleware)
│  │     │  └─ api/             # ← collapse 48 routes via [...path] factory
│  │     ├─ features/           # feature-scoped UI + hooks (cart, product, auth…)
│  │     ├─ components/ui/       # shared primitives (Button, Input, Pagination…)
│  │     ├─ lib/                 # api-proxy, constants, env, mappers
│  │     └─ context/
│  └─ api/                      # NestJS — keep modular (already good)
│     └─ src/
│        ├─ modules/<feature>/  # controller, service, dto, schemas
│        ├─ common/             # guards, filters, interceptors, pipes, dto
│        └─ database/migrations/ # idempotent, versioned (replace ad-hoc scripts)
├─ packages/
│  ├─ shared-types/             # DTOs/contracts consumed by BOTH apps (single source of truth)
│  ├─ config/                   # eslint, tsconfig, prettier presets
│  └─ ui/                       # (optional) shared design-system components
├─ .github/workflows/           # lint, test, deploy
├─ docker-compose.yml           # mongo + redis + both apps for local parity
└─ turbo.json
```

Key moves: **(a)** one `[...path]/route.ts` proxy factory replaces 48 hand-written handlers; **(b)** `packages/shared-types` ends Next/Nest schema drift; **(c)** versioned idempotent migrations replace the 13 ad-hoc `database/*.js` scripts; **(d)** remove the hardcoded `'d:/N3 Projects/...'` path in `next.config.ts`.

---

## 5. Database Improvements (Deliverable #5)

1. **Add indexes (cheapest highest-leverage win):**
   - `Category.index({ slug: 1 })`, `{ name: 1 }`
   - `Product.index({ price: 1, createdAt: -1 })`, `{ rating: -1, createdAt: -1 }`, compound `{ category: 1, price: 1, isActive: 1 }`, plus `subcategory`/`skinType`/`productType`
   - `User.index({ createdAt: -1 })`, `{ isActive: 1, createdAt: -1 }`; `Review.index({ createdAt: -1 })`, `{ user: 1, createdAt: -1 }`
   - analytics `Event.index({ createdAt: -1 })`; `CategoryBanner.index({ category: 1 })`
2. **Order integrity:** re-fetch + validate products at order time; recompute totals server-side; wrap in transactions; optionally decrement stock.
3. **Schema-layer validators:** `min: 0` on prices/numerics, length bounds on text, cross-field rules (`compareAtPrice >= price`, `discountPct 0–100`).
4. **Soft-delete plugin:** auto-inject `{ deletedAt: null }` on reads instead of per-query defensive code.
5. **Incremental rating stats:** maintain `ratingSum`/`ratingCount` on Product; stop O(n) re-aggregation on every review change.
6. **TTL hygiene:** expire stale carts (90d) and unbounded analytics events; add `lastSyncedAt` to cart items.
7. **Search:** convert regex filters → MongoDB `$text` index with relevance ranking.

---

## 6. API Improvements (Deliverable #6)

- **Standardize pagination:** shared `PaginatedResponse<T>` DTO + `PaginationQueryPipe` (enforce `limit ≤ 100`) across orders/reviews/products/users/analytics.
- **Validate enums & numbers:** `UpdateStatusDto` with `@IsIn([...])` for order/payment status; `@Min(0)` on price filters; explicit boolean transforms.
- **Validate references on create:** category, wishlist product, review user (prevent orphans); fix possible slug collisions on bulk import (catch dup-key + retry).
- **Transactions** for multi-step ops (order-from-cart, rating recompute).
- **Fail-closed RBAC:** make `RolesGuard` throw on missing role rather than returning `true`.
- **Per-route rate limits** on write/auth endpoints (currently global 100/60s only).
- **Swagger:** `@ApiResponse` + `@ApiBearerAuth('JWT')` on bulk-import/merge/auth; document response shapes.
- **Resilient proxy:** add timeout (5s) + retry (2× backoff) + structured error shape to `proxyRequest` so a NestJS hiccup doesn't break the storefront.
- **Decouple modules:** drop `MongooseModule` from `AuthModule` exports; let modules own their schema imports.

---

## 7. UI/UX Recommendations (Deliverable #7)

**Storefront (score 7 — refine edges):**
- Replace silent fetch failures with error states + retry (exponential backoff); add an app-level error boundary.
- Wire the **contact form** to a real `POST /api/contact` (or Brevo) — it currently calls `alert()`.
- Show product skeleton before `notFound()` (don't 404 while loading); use `AbortController` on the size-variant fetch to kill the stale-response race.
- Don't lose guest cart on login-merge failure — surface a non-blocking toast + retry.
- **A11y:** `aria-label` on cart/wishlist/user buttons; `autocomplete` hints on auth fields; `rel="noopener noreferrer"` on external buy links.
- Persist category filters in URL params (bookmarkable); show skeleton grid to kill layout shift; fix mobile bottom-bar overlapping Reviews (`mb-[80px]`).

**Admin (score 4 — see roadmap §10):** extract reusable `Pagination`, `AdminInput`, card/section styles; add image-gallery upload UI, draft/publish workflow, bulk multi-select, loading skeletons, file-type/size validation on uploads.

---

## 8. Security Enhancements (Deliverable #8)

**Immediate (Phase 0):**
1. Rotate **all** secrets; purge `.env` from git; generate 32-byte access/refresh secrets; force global re-login.
2. Make admin middleware **verify** JWT signature + expiry + `role` claim (not cookie presence).
3. CSRF: `SameSite=strict` for admin cookies + CSRF token or Origin/Referer validation on state-changing requests.
4. Brute-force protection: account-based lockout + exponential backoff + CAPTCHA after N fails; tighter per-endpoint throttles (login 5/min, OTP 5/10min/email).
5. Password policy: strength rules (zxcvbn), `@MaxLength(64)` + trim on login DTO, random admin seed password + forced first-login change.

**Near-term:**
- **MFA (TOTP)** mandatory for admin role, with hashed backup codes.
- **RBAC + audit log:** roles (Super Admin / Product / Order / Support / Finance), per-mutation audit trail, 30-min session timeout.
- Verify Google ID tokens locally (cached certs, check `aud`/`iss`/`exp`) instead of per-request `tokeninfo` calls.
- OTP endpoints: constant-time responses to prevent account enumeration.
- Field-level PII filtering in admin user lists; validate external API responses (Zod) before use.
- **GDPR:** data-export & deletion-request workflows, PII redaction in logs.

---

## 9. Performance Optimizations (Deliverable #9)

| Lever | Action |
|---|---|
| **Indexes** | Add all missing indexes (§5); verify with `.explain()`; enable slow-query profiler (>100ms) |
| **HTTP cache** | `export const revalidate` + `Cache-Control: public, max-age` on products/family/carousel/banners; tag-based purge on admin mutation |
| **Redis** | Cache-aside for hot products (~top 1K), categories, carousel, banners (TTL 5–60min); cached analytics (cron-recomputed + "Refresh Now") |
| **Client** | SWR/React Query for in-flight dedup + filter-combo cache; move catalog fetch to a server component / ISR instead of full-catalog-on-mount |
| **Images** | `blurDataURL` placeholders, accurate `sizes`, lazy hover-image, Cloudinary responsive srcSet; monitor LCP/CLS |
| **Bundle** | `@next/bundle-analyzer`; dynamic-import Three.js & Framer Motion; consider splitting admin bundle from storefront |
| **Search** | regex → `$text` + relevance now; Algolia/Elasticsearch when it outgrows it |
| **DB conn** | `maxPoolSize:100`, fast-fail timeouts, circuit breaker |

---

## 10. Enterprise Admin Panel Roadmap (Deliverable #10)

| Milestone | Features | Depends on | Effort |
|---|---|---|---|
| **Q1 — Operate safely** | Inventory/variant/stock mgmt; **RBAC + audit log + admin MFA + session timeout**; bulk multi-select; reusable Pagination/AdminInput | RBAC gates all later staff/vendor work; inventory unblocks order validation (C3) | XL + L |
| **Q2 — Fulfill & comply** | Order lifecycle (refunds/returns/RMA); tax calc/reporting; advanced order analytics (AOV, top products, SLA); image-upload UI + draft/publish | Inventory (Q1); RBAC for finance-scoped refunds | XL + M |
| **Q3 — Grow revenue** | Coupons/promotions; gift cards/store credit; customer segmentation/CLV dashboard; abandoned-cart recovery | Analytics events (exist); segmentation feeds campaigns | XL + L |
| **Q4 — Channels & automation** | Email/SMS marketing + A/B; CMS/landing-page builder; API-key/webhook mgmt; real-time admin notifications (Socket.io) | Marketing primitives (Q3) | XL + M |
| **Future / conditional** | Multi-vendor marketplace; i18n + multi-currency (GBP/AED, RTL) | **Multi-vendor REQUIRES RBAC + payouts + per-vendor analytics** | XL |

**Critical dependency chain:** RBAC + audit (Q1) → finance-scoped refunds (Q2) → segment-targeted promotions (Q3) → vendor permissioning (Future). **Build RBAC early or re-plumb permissions four times.**

---

## 11. Missing Features Analysis (Deliverable #11)

Against a Shopify/Magento-class admin, these are absent today (effort in parens):

- **Catalog:** product variants/attributes (XL), SKU/inventory/stock (M), digital products (M), product scheduling & approval workflow (M), revision history (M).
- **Orders:** refunds/returns/RMA (XL), invoice generation (M), shipment tracking (M), automated notifications (M), order audit log (S).
- **Customers:** segmentation (XL), CLV analytics (XL), loyalty program (L), activity tracking (M), support inbox (L).
- **Marketing:** coupons/discounts (XL), promotional campaigns (L), gift cards/store credit (L), abandoned-cart recovery (XL), email/SMS/push campaigns (XL), referral & affiliate programs (XL).
- **Content:** CMS pages + landing builder (XL), blog (M), media library (M), dynamic content blocks (M).
- **Marketplace:** multi-vendor onboarding, payouts, commission, vendor analytics & verification (XL).
- **Finance:** P&L, tax management, payout tracking, accounting integrations (XL).
- **Security/Compliance:** RBAC + granular permissions (L), MFA (L), login monitoring & audit logs (M), GDPR export/delete (M).
- **AI:** product-description & SEO generation, sales/inventory forecasting, behavior analysis, support assistant, recommendations (M–XL each). *Note: `@anthropic-ai/sdk` is already a dependency but unused — a natural starting point.*
- **Platform:** i18n/multi-currency (M), PWA/offline (M), WebSocket real-time (L), notification center (M), saved views/custom dashboards (M), automation workflows + scheduled tasks (L), webhook management (M).

---

## 12. Scalability Plan — Millions of Users/Products (Deliverable #12)

1. **Indexing (first, cheap):** all indexes in §5; `.explain()` verification; slow-query profiler.
2. **Caching layers (highest leverage):** HTTP/ISR on public routes → Redis cache-aside for hot data (invalidate on write) → client SWR/React Query dedup. Cache analytics dashboards (cron-recomputed).
3. **Search:** MongoDB `$text` now → Algolia/Elasticsearch at scale; track & surface trending searches.
4. **CDN/geo:** edge-deploy storefront (Vercel/Cloudflare); ISR-prerender popular product pages; multi-region NestJS + **MongoDB Atlas read replicas**; geo-routing.
5. **Async/queues:** move emails (Brevo), analytics aggregation, image jobs (Cloudinary), abandoned-cart triggers to **BullMQ/Redis** so request latency stays flat; incremental rating stats.
6. **DB scaling & hygiene:** connection pool (`maxPoolSize:100`), fast-fail timeouts, circuit breaker; TTL indexes for stale carts (90d) & analytics events; cart-snapshot freshness with checkout re-validation.
7. **The proxy-hop decision — keep it:** correct boundary for httpOnly cookie/token isolation. But (a) collapse 48 routes into a factory, (b) cache at the proxy so hits don't round-trip to NestJS, (c) add timeout + retry + structured errors. Latency cost is acceptable once cached; the security benefit is real.
8. **Observability (can't scale what you can't see):** Sentry on both apps; structured JSON logs w/ request/user context; Core Web Vitals (LCP/CLS); Atlas slow-query analytics; Prometheus/Grafana for pool + latency.

---

## Quick Wins (≤1 day each)

- Add the missing DB indexes (one-line `Schema.index()` calls).
- `UpdateStatusDto` + `@IsIn([...])`; `@Min(0)` on price filters; explicit `isFeatured` boolean transform.
- Validate existence in create paths (categoryId, wishlist product, review user).
- Login DTO `@MaxLength(64)` + trim.
- `rel="noopener noreferrer"` on external buy links + ESLint rule.
- `aria-label` on cart/wishlist/user buttons; auth-form autocomplete hints.
- Remove `MongooseModule` from `AuthModule` exports; remove unused `@anthropic-ai/sdk`; delete duplicate `_components/ProductForm.tsx` (verify unused first).
- Centralize constants (`API_BASE`, `STORAGE_KEYS`, cookie TTLs, `getAdminToken()`) — kills 31-file + 6-file duplication.
- Replace hardcoded `'d:/N3 Projects/...'` path in `next.config.ts` with `process.cwd()`.
- Mobile: `mb-[80px]` spacer so bottom-bar stops overlapping Reviews.
- `AbortController` on product size-variant fetch.
- Wire contact form to a real endpoint.
- `@ApiResponse` + `@ApiBearerAuth('JWT')` on key endpoints.

---

## Appendix — Full Findings by Dimension

> Severity: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low. Effort: S (<2h) · M (<1d) · L (<3d) · XL (>3d).

### A. Architecture & Project Structure (7/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🟡 | 48 proxy routes lack DRY abstraction | `src/app/api/**` | M |
| 🟡 | Env-file handling inconsistency; hardcoded path in `next.config.ts` | root + `enjoyful-api/.env` | M |
| 🟡 | No shared types between Next & Nest (schema drift) | both apps | M |
| 🟡 | Missing env-config validation at boot | `main.ts`, ConfigModule | S |
| 🟢 | `admin-api.ts` mirrors endpoints without abstraction | `src/lib/admin-api.ts` | S |
| 🟢 | Ad-hoc `normalizeProduct()` scattered | `api/admin/products/route.ts` | S |
| 🟢 | Seed/migration scripts not idempotent/automated | `enjoyful-api/src/database/` | M |
| 🟢 | No living folder-structure/contribution docs | `CLAUDE.md` | S |
| 🟢 | Global guard/middleware not extensible per-route | `main.ts`, `app.module.ts` | S |
| 🟢 | `process.env` accesses untyped/unvalidated | `lib/api-proxy.ts` | S |

### B. Backend API & NestJS Design (6/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🟠 | Password not required-checked → login crash path on passwordless accounts | `auth.service.ts`, `user.schema.ts` | S |
| 🟠 | Review create doesn't validate `user` exists | `reviews.service.ts:77-116` | S |
| 🟡 | Inconsistent pagination response shape | orders/reviews/products/cart services | S |
| 🟡 | Pagination limits not enforced | orders/reviews/users controllers | S |
| 🟡 | `RolesGuard` returns `true` on missing role (fail-open) | `roles.guard.ts` | S |
| 🟡 | Hardcoded `shippingCost = 0` | `orders.service.ts:46` | M |
| 🟡 | No enum validation on order status updates | `orders.controller.ts` | S |
| 🟡 | No rate limiting on critical write endpoints | `auth.controller.ts` | M |
| 🟡 | Cart merge silently fails on missing products | `cart.service.ts:133` | M |
| 🟡 | Product slug collisions possible on bulk import | `products.service.ts:159-165` | M |
| 🟡 | No transactions for multi-step ops | `orders.service.ts`, `reviews.service.ts` | L |
| 🟡 | `categoryId` not validated to exist | `products.service.ts:161` | S |
| 🟡 | Wishlist add doesn't validate product exists | `wishlist.service.ts:28` | S |
| 🟡 | Refresh-token strategy needs review (separate secret, revocation) | `auth/strategies/` | M |
| 🟢 | Inconsistent missing-record responses (NotFound vs empty) | multiple services | S |
| 🟢 | Sparse Swagger on complex ops | bulk-import/merge | S |
| 🟢 | No validation on query-param transforms | `product-query.dto.ts` | S |
| 🟢 | `AuthModule` exports `MongooseModule` | `auth.module.ts:23` | S |
| 🟢 | Sanitize middleware exists but unregistered | `common/middleware/` | S |
| 🟢 | Reviews aggregation returns stale stats | `reviews.service.ts:21-47` | M |
| 🟢 | DTO arrays lack element/size constraints | `create-product.dto.ts` | S |

### C. Database & Data Modeling (6/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🔴 | No stock/price/active validation before order creation | `orders.service.ts:20-68` | M |
| 🟠 | Missing indexes on `Category` (slug, name) | `category.schema.ts` | S |
| 🟠 | No index on Product price/rating/createdAt/isActive | `product.schema.ts` | M |
| 🟠 | Cart stores stale product snapshots indefinitely | `cart.schema.ts:7-26` | M |
| 🟠 | Soft-delete checked per-query (risk of exposure) | cross-cutting | L |
| 🟡 | User/Review lack `createdAt` index | `user.schema.ts` | S |
| 🟡 | No TTL cleanup for stale carts/events | `cart.schema.ts` | M |
| 🟡 | No schema-layer validators on critical fields | `product.schema.ts` | M |
| 🟡 | O(n) review-rating recomputation on every change | `reviews.service.ts:225` | L |
| 🟢 | No compound `{isActive,createdAt}` user index | `user.schema.ts` | S |
| 🟢 | `CategoryBanner` missing explicit index | `category-banner.schema.ts` | S |
| 🟢 | Product images not versioned/audited | `product.schema.ts:6-12` | S |

### D. Security, Auth & Access Control (5/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🔴 | Production credentials in version-controlled `.env` | `enjoyful-api/.env` | M |
| 🔴 | Weak JWT secrets → token forgery | `auth.service.ts`, `.env` | S |
| 🟠 | Admin middleware checks cookie presence, not validity | `src/middleware.ts:6-12` | M |
| 🟠 | Missing CSRF protection | cross-cutting | M |
| 🟠 | No brute-force protection on auth endpoints | `auth.controller.ts` | M |
| 🟠 | No password-strength rules; weak admin seed password | `register.dto.ts`, `.env` | M |
| 🟠 | No MFA for admin accounts | auth flow | L |
| 🟡 | PII exposure in admin user list (no field filtering) | `users.service.ts:57-76` | M |
| 🟡 | Login DTO password lacks length/format constraints | `login.dto.ts` | S |
| 🟡 | Google token verified via remote `tokeninfo` (no local verify) | `auth.service.ts:217-275` | M |
| 🟡 | Account enumeration via OTP request endpoint | `auth.service.ts:123-157` | S |
| 🟡 | Cookie `secure` not enforced in dev | `auth.controller.ts:142` | S |
| 🟢 | Refresh doesn't check `isActive` | `jwt-refresh.strategy.ts` | S |
| 🟢 | Regex-injection edge cases in user search | `users.service.ts:20-26` | S |
| 🟢 | Order PII exposure if roles confused | `orders.service.ts:71-98` | S |

### E. Storefront Frontend (7/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🟠 | Silent error suppression in data fetches | `DataContext.tsx:121-140` | M |
| 🟠 | Contact form submits via `alert()`, no backend | `contact/page.tsx:17-21` | M |
| 🟡 | `notFound()` called before products load | `product/[id]/page.tsx:69` | S |
| 🟡 | Race condition in size-variant fetch (stale overwrite) | `product/[id]/page.tsx:56-67` | S |
| 🟡 | Cart-merge errors on login silently ignored | `DataContext.tsx:229-237` | M |
| 🟡 | Missing `rel="noopener"` on external buy links | `product/[id]/page.tsx:345` | S |
| 🟢 | Missing autocomplete on auth fields | `AuthModal.tsx:275-349` | S |
| 🟢 | Cart button lacks `aria-label` | `StickyHeader.tsx:241` | S |
| 🟢 | Filters not persisted in URL | `category/[category]/page.tsx:102` | M |
| 🟢 | Layout shift during filter fetch | `category/[category]/page.tsx:109` | M |
| 🟢 | Mobile bottom-bar overlaps Reviews | `product/[id]/page.tsx:515` | S |

### F. Admin Panel & Enterprise Gap (4/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🔴 | No product variants/SKU inventory mgmt | admin products + form | XL |
| 🔴 | No order lifecycle (refunds/returns/disputes) | `admin/orders/[id]` | XL |
| 🟠 | No customer segmentation/CLV | `admin/users` | XL |
| 🟠 | No coupon/discount/promotion mgmt | cross-cutting | XL |
| 🟠 | No gift cards/store credit | cross-cutting | L |
| 🟠 | No RBAC/staff permissions/audit log | `admin/layout.tsx` | L |
| 🟠 | No email/SMS/abandoned-cart marketing | cross-cutting | XL |
| 🟠 | No inventory/stock warnings | `admin/products` | M |
| 🟠 | No CMS/landing-page builder | cross-cutting | XL |
| 🟠 | No multi-vendor/marketplace | cross-cutting | XL |
| 🟡 | No advanced order/fulfillment analytics | `admin/page.tsx` | M |
| 🟡 | No API-key/webhook mgmt | cross-cutting | M |
| 🟡 | No tax calculation/compliance | `admin/orders/[id]` | M |
| 🟡 | Manual 401 checks instead of middleware | admin pages | M |
| 🟡 | No bulk multi-select actions | admin tables | M |
| 🟡 | Missing file-type validation on uploads | banners/carousel | S |
| 🟢 | Duplicate input class definitions | multiple admin pages | S |
| 🟢 | No reusable Pagination component | reviews/users/orders | S |
| 🟢 | No real-time admin notifications | cross-cutting | L |
| 🟢 | No i18n/multi-currency in admin | `admin/**` | M |
| 🟢 | No undo/revision history for edits | `admin/products/[id]/edit` | M |
| 🟢 | No carousel/banner loading skeleton | `admin/carousel` | S |
| 🟢 | Product form lacks image preview/gallery | `ProductForm.tsx:460` | M |
| 🟢 | No draft/publish workflow | `ProductForm.tsx` | M |

### G. Performance, Caching & Scalability (4/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🟠 | No HTTP caching — all routes `no-store` | `api/**` | M |
| 🟠 | Images lack blur/srcSet/size hints | category/product/ProductCard | M |
| 🟠 | No Redis/in-memory cache layer | API services | L |
| 🟠 | No CDN/geo distribution | `next.config.ts` | XL |
| 🟡 | DataContext fetches whole catalog on mount | `DataContext.tsx:121` | M |
| 🟡 | No caching on filter/sort fetches | `category/[category]/page.tsx` | M |
| 🟡 | Analytics aggregation runs uncached per visit | `analytics.service.ts:41-112` | M |
| 🟡 | Missing indexes for filter queries; regex search | `products.service.ts` | S |
| 🟡 | No pagination on analytics event list | `analytics.service.ts:68` | S |
| 🟡 | No asset compression/code-splitting analysis | `package.json` (Three.js, Framer) | M |
| 🟡 | Search won't scale past ~10K products | `quick-search` + service | M |
| 🟡 | No error boundary if NestJS down | `DataContext.tsx` | S |
| 🟡 | Mongoose pool/timeouts/slow-query not configured | `app.module.ts` | M |
| 🟢 | Product detail variant fetch uncached | `product/[id]/page.tsx:56` | S |

### H. Cross-cutting Quality / Duplication / Tech Debt (6/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🟡 | 31 route files duplicate `API_BASE` | `src/app/api/` | S |
| 🟡 | 6 admin routes duplicate `getToken()` | `api/admin/*` | S |
| 🟡 | Duplicated admin response/error patterns | `api/admin/*` | S |
| 🟡 | 3 separate Mongo-normalization fns | `api/admin/{products,carousel,banners}` | M |
| 🟢 | `admin-api.ts` incomplete (carousel/reviews) | `lib/admin-api.ts` | S |
| 🟢 | Duplicate `ProductForm` in two locations | `admin/products/**` | S |
| 🟢 | Unused `@anthropic-ai/sdk` dependency | `enjoyful-api/package.json` | S |
| 🟢 | Magic-string localStorage keys | `DataContext.tsx` | S |
| 🟢 | Inconsistent cookie naming | auth routes | M |
| 🟢 | No shared error-response format | `api/**` | M |
| 🟢 | Duplicated cookie maxAge magic numbers | auth routes | S |

### I. Testing, Observability & CI/CD (4/10)
| Sev | Finding | Location | Effort |
|---|---|---|---|
| 🔴 | Zero production test coverage (only stubs) | both apps | XL |
| 🔴 | No CI/CD, no staging/prod separation, no Dockerfile | repo root | L |
| 🟠 | No structured logging (console-based) | `main.ts`, services, scripts | M |
| 🟠 | Minimal error recovery in proxy routes (no timeout/retry) | `lib/api-proxy.ts` | M |
| 🟠 | No validation of external API responses | `auth.service.ts`, `brevo.service.ts` | S |
| 🟠 | No e2e test env / data seeding | `test/` | L |
| 🟡 | No health checks / startup validation | `main.ts` | S |
| 🟡 | Exception filter doesn't report to monitoring | `http-exception.filter.ts` | S |
| 🟡 | Config tolerates missing env vars | `app.module.ts`, services | S |
| 🟡 | No rate-limit exemptions for admin/internal | `app.module.ts` | S |
