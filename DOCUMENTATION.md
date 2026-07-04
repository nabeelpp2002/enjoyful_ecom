# Documentation — enJoyful Life E-Commerce

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Getting Started](#2-getting-started)
3. [Pages & Features](#3-pages--features)
4. [Product Catalogue](#4-product-catalogue)
5. [Cart & Wishlist](#5-cart--wishlist)
6. [Navigation & Header](#6-navigation--header)
7. [Design System](#7-design-system)
8. [Pre-launch → Live Switch](#8-pre-launch--live-switch)
9. [Adding Products](#9-adding-products)
10. [Deployment](#10-deployment)
11. [Bug Tracker](#11-known-bugs)

---

## 1. Project Summary

**enJoyful Life** is a premium skincare and wellness e-commerce site targeting the UAE and UK markets. The product line covers four categories:

| Category | Products |
|---|---|
| **Glow** | Face serums, toners, cleansers, night creams |
| **Baby** | Baby lotions, shampoos, oils |
| **Home** | Candles, room sprays |
| **Daily** | Body care sets, body lotions |

The store is currently in **pre-launch mode**. Visitors see a "Coming Soon" page with email capture. The full storefront (header, product pages, cart, category browsing) is fully built and ready to activate.

---

## 2. Getting Started

### Prerequisites

- Node.js 20+
- npm (comes with Node)

### Installation

```bash
cd enjoyful_ecom
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical URL for metadata | `https://enjoyfullife.com` |

Create a `.env.local` file for local overrides:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Pages & Features

### `/` — Homepage (ComingSoon)

Currently shows the pre-launch landing page:
- Animated logo with floating product icon sprites
- "Coming Soon" headline with typewriter tagline ("Where joy meets care")
- Email capture form → submits to SheetDB Google Sheets integration
- Success/error feedback states

The full homepage (HeroSection + product grid) is built but commented out — see [Section 8](#8-pre-launch--live-switch).

### `/category/[category]`

Product listing page for each category. Supported routes:
- `/category/glow`
- `/category/baby`
- `/category/home`
- `/category/daily`
- `/category/all` — shows all products

Features:
- Full-width banner image (mobile and desktop versions)
- Filter bar: Product Type, Price Range, Skin Type (Glow only)
- Sort: Featured / Price Low-High / Price High-Low / Highest Rated
- Product grid (2 columns mobile, 4 columns desktop)
- Product cards with hover image swap, wishlist toggle, quick-view icon
- `CategoryPromo` section at the bottom

Search is also routed here via `?q=` query param.

### `/product/[id]`

Product detail page:
- 4-thumbnail image gallery (currently shows same image 4×)
- Product name, rating stars, review count, price
- Quantity selector
- Add to Cart + Wishlist buttons
- Accordion sections: Key Benefits, Ingredients, How to Use
- Brand philosophy section
- Related products from the same category

### `/cart`

Shopping cart page:
- List of cart items with image, name, category, price
- Quantity controls (+ / −) and remove button
- Order summary sidebar: subtotal, shipping (Free), total
- "Proceed to Checkout" button (no handler yet)
- Empty state with image and "Start Shopping" CTA

### `/wishlist`

Saved products page.

### `/about`

Static brand story page.

### `/contact`

Contact information page.

---

## 4. Product Catalogue

Products are defined in `src/data/products.ts`. There are currently **12 products**.

### Product Fields

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique identifier (used in URL `/product/[id]`) |
| `name` | `string` | Display name |
| `category` | `string` | Top-level category: `Glow`, `Baby`, `Home`, `Daily` |
| `subcategory` | `string` | Subcategory label |
| `price` | `number` | Price in AED |
| `image` | `string` | Primary image path (`/assets/filename.png`) |
| `hoverImage` | `string` | Alternate image shown on card hover |
| `rating` | `number` | Star rating (0–5) |
| `reviews` | `number` | Number of reviews |
| `description` | `string` | Short product description |
| `benefits` | `string[]` | Bullet point benefits |
| `ingredients` | `string[]` | Ingredient list |
| `howToUse` | `string` | Usage instructions |
| `skinType` | `string[]` | Optional. e.g. `["Dry", "Normal"]` |
| `productType` | `string` | Optional. Used by category filter e.g. `"Serum"` |

### Current Products

| ID | Name | Category | Price (AED) |
|---|---|---|---|
| 1 | Hydrating Face Serum | Glow | 45 |
| 2 | Baby Gentle Lotion | Baby | 32 |
| 3 | Lavender Home Candle | Home | 38 |
| 4 | Nourishing Night Cream | Glow | 52 |
| 5 | Daily Body Care Set | Daily | 68 |
| 6 | Vitamin C Brightening Serum | Glow | 48 |
| 7 | Baby Soft Shampoo | Baby | 28 |
| 8 | Eucalyptus Room Spray | Home | 24 |
| 9 | Gentle Face Cleanser | Glow | 34 |
| 10 | Daily Moisturizing Body Lotion | Daily | 36 |
| 11 | Rose Water Toner | Glow | 29 |
| 12 | Baby Oil Pure | Baby | 26 |

---

## 5. Cart & Wishlist

Both are managed by `DataContext` and persisted in `localStorage`.

### Cart

```ts
// Add a product
const { addToCart } = useData();
addToCart(product, quantity);  // quantity defaults to 1

// Remove
removeFromCart(productId);

// Update quantity
updateCartQuantity(productId, newQuantity);  // minimum 1

// Check
isInCart(productId);  // boolean

// Total
getCartTotal();  // sum of (price × quantity)
```

### Wishlist

```ts
const { addToWishlist, removeFromWishlist, isInWishlist } = useData();
addToWishlist(product);
removeFromWishlist(productId);
isInWishlist(productId);  // boolean
```

localStorage keys: `enjoyful-cart`, `enjoyful-wishlist`.

---

## 6. Navigation & Header

`StickyHeader` includes:
- **Logo** — links to `/`
- **Mega Menu** — 5 categories, each with subcategory list and category image. Triggered on hover (desktop only)
- **Search** — clicking the search icon slides in a text input that auto-routes to `/category/all?q=…`
- **Wishlist icon** — badge dot appears when wishlist is non-empty
- **User icon** — decorative (no auth yet)
- **Cart icon** — badge with item count

The header has two visual modes, automatically toggled:
- **Pill/floating** — on homepage before scrolling: rounded, inset from edges
- **Full-width bar** — on all other pages or after scrolling: full-width, frosted glass effect

`MobileBottomNav` provides bottom tab navigation on small screens.

---

## 7. Design System

### Colours

| Name | Hex | Tailwind class |
|---|---|---|
| Brand Purple | `#735697` | `text-[var(--color-brand-purple)]` |
| Mustard | `#F4B449` | `bg-[var(--color-brand-mustard)]` |
| Onyx | `#1A1A1B` | `text-[var(--color-brand-onyx)]` |
| Sand | `#F9F5F0` | `bg-[var(--color-brand-sand)]` |

Category tint colours:
- Glow: `#F0EDF6` (soft lavender)
- Baby: `#E6F0F9` (soft blue)
- Home: `#EAF3EB` (soft green)
- Daily: `#FBEBE5` (soft peach)

### Typography

- **Headings**: Montserrat (`font-heading`) — weights 400–800
- **Body**: Open Sans (`font-sans`) — weights 400, 600

### Border Radius

The UI favours heavily rounded elements: `rounded-full` for pills and buttons, `rounded-[1.5rem]` / `rounded-[2rem]` for cards.

---

## 8. Pre-launch → Live Switch

When ready to go live, make these two edits:

**Step 1 — Activate the homepage** (`src/app/page.tsx`):

```tsx
// Replace the current export with:
export default function Home() {
  return (
    <>
      <HeroSection />
      <ShopByCategory />
      <FeaturedProducts />
      <FeaturesSection />
      <NewsletterSection />
    </>
  );
}
```

**Step 2 — Uncomment layout chrome** (`src/app/layout.tsx`):

```tsx
// Uncomment these lines:
<TopOfferBar />
<StickyHeader />
// ...
<Footer />
<MobileBottomNav />
```

---

## 9. Adding Products

Open `src/data/products.ts` and append to the `products` array:

```ts
{
  id: 13,                          // next sequential id
  name: "New Product Name",
  category: "Glow",                // Glow | Baby | Home | Daily
  subcategory: "Face Serum",
  price: 55,                       // AED
  image: "/assets/new_product.png",
  hoverImage: "/assets/new_product_hover.png",
  rating: 4.8,
  reviews: 0,
  description: "Product description here.",
  benefits: ["Benefit 1", "Benefit 2"],
  ingredients: ["Ingredient A", "Ingredient B"],
  howToUse: "Apply to clean skin daily.",
  skinType: ["All skin types"],
  productType: "Serum",
},
```

Place images in `public/assets/`. They must be accessible at `/assets/filename.png`.

---

## 10. Deployment

The project is a standard Next.js app and can be deployed to:

- **Vercel** (recommended) — zero config, push to GitHub and import
- **Netlify** — set build command `npm run build`, publish dir `.next`
- **Self-hosted** — `npm run build && npm run start`

Set `NEXT_PUBLIC_APP_URL` to your production domain in the hosting environment.

---

## 11. Known Bugs

| # | Bug | Location | Severity |
|---|---|---|---|
| 1 | "Add to Cart" `+` button on product cards does nothing | `FeaturedProducts.tsx`, `CategoryPage`, related products in `product/[id]` | High |
| 2 | Currency shows £ GBP in related products section | `product/[id]/page.tsx:456` | Medium |
| 3 | Price filter max hardcoded at 100 AED, misses no products with current data | `category/[category]/page.tsx` | Low |
| 4 | Product detail shows 4× the same image (no multi-image support in data model) | `product/[id]/page.tsx:28` | Low |
| 5 | Checkout button has no handler | `cart/page.tsx:157` | High (pre-launch) |
| 6 | Header/footer/nav are commented out during pre-launch | `layout.tsx` | Expected |
