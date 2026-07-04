# Cloudinary Upload Plan — Enjoyful Life
**Date:** 2026-06-01

---

## The 4-Step Process

```
1. CONVERT   Local PNG/JPG → WebP  (sharp, ~70% smaller)
2. ORGANISE  Rename to standard slug naming
3. UPLOAD    WebP files to Cloudinary with correct folder path
4. UPDATE    MongoDB products with new Cloudinary URLs
```

---

## Cloudinary Folder Structure

```
enjoyful/                              ← cloud root
└── products/
    ├── glow/
    │   ├── face-wash/
    │   │   ├── lemon-vit-c/
    │   │   │   ├── lemon-vit-c21.webp       ← thumbnail
    │   │   │   ├── lemon-vit-c2.webp        ← hover
    │   │   │   └── lemon-vit-c3.webp        ← gallery
    │   │   ├── orange-vit-c/
    │   │   ├── papaya-vit-c/
    │   │   ├── charcoal/
    │   │   └── foaming-vit-c/
    │   ├── face-scrub/
    │   │   ├── coffee/
    │   │   │   ├── 150ml/
    │   │   │   └── 50ml/
    │   │   ├── walnut/
    │   │   ├── apricot/
    │   │   └── walnut-apricot/
    │   ├── face-mask/
    │   │   └── peel-off/
    │   ├── sunscreen/
    │   ├── aloe-vera-gel/
    │   ├── rose-water/
    │   └── body-scrub/
    │       ├── roseradiance/
    │       └── sapphire-night/
    ├── daily/
    │   ├── body-lotion/
    │   │   ├── almond/
    │   │   ├── aloevera/
    │   │   ├── mix-fruit/
    │   │   └── moisture-balance/
    │   ├── body-cream/
    │   │   ├── almond/
    │   │   ├── mix-fruit/
    │   │   ├── daily-delight/
    │   │   ├── nourish-plus/
    │   │   └── repair-plus/
    │   ├── shower-gel/
    │   │   ├── aloe-bliss/
    │   │   ├── c-glow/
    │   │   ├── ice-blast/
    │   │   └── morning-buzz/
    │   ├── shampoo/
    │   │   ├── aloe-calm/
    │   │   ├── bamboo-balance/
    │   │   ├── botanical-deep-clean/
    │   │   └── onion/
    │   ├── hair-oil/
    │   │   └── jasmin/
    │   ├── hair-serum/
    │   │   └── silky-touch/
    │   ├── intimate-wash/
    │   └── hair-removal-cream/
    ├── baby/
    │   ├── baby-lotion/
    │   ├── baby-wash/
    │   ├── baby-talc/
    │   ├── baby-rash-cream/
    │   └── baby-soap/
    └── fragrances/
        ├── perfume-100ml/
        │   ├── amber-imperial/
        │   ├── amber-nocturne/
        │   ├── amber-ophir/
        │   ├── atlas-oud/
        │   ├── benz-lumiere/
        │   ├── jasmine-nomade/
        │   ├── noir-velours/
        │   ├── petal-damichu/
        │   ├── reine-florale/
        │   ├── royal-eclat/
        │   ├── royal-safran/
        │   └── zoya-flora/
        ├── perfume-50ml/
        │   ├── cuir-imperial/
        │   ├── ebene-noir/
        │   ├── gold-victorie/
        │   ├── imperium-noir/
        │   ├── intense-aibek/
        │   ├── laichu-signature/
        │   ├── minuit-noir/
        │   ├── monarach-oud/
        │   ├── noir-lehan/
        │   ├── obsidien/
        │   ├── oud-prive/
        │   └── safran-intense/
        ├── body-mist/
        │   ├── amber-glow/
        │   ├── blossom-veil/
        │   ├── coastal-pulse/
        │   ├── midnight-velvet/
        │   ├── noir-element/
        │   └── vanilla-aura/
        ├── roll-on/
        │   ├── apex-72h/
        │   ├── element-zero/
        │   ├── lumi-glow/
        │   ├── noir-oud/
        │   ├── pure-renewal/
        │   └── velvet-repair/
        └── deo-stick/
            ├── pure-fresh/
            ├── silk-bloom/
            └── ultra-fresh/
```

---

## Cloudinary URL Format (after upload)

Every image served through Cloudinary uses this URL pattern:

```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/{transforms}/{folder/path}
```

**Transforms applied at serve time (not baked in):**
```
f_auto,q_auto,w_800    → product page gallery (desktop)
f_auto,q_auto,w_400    → product grid cards
f_auto,q_auto,w_200    → thumbnails
f_auto,q_auto,w_80,e_blur:500  → blur placeholder
```

**Example final URL:**
```
https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto,w_800/enjoyful/products/glow/face-wash/lemon-vit-c/lemon-vit-c21
```

The `.webp` extension is NOT in the URL — Cloudinary auto-negotiates format via `f_auto`.

---

## Image Naming Standard (inside each product folder)

| File | Role |
|---|---|
| `{slug}21.webp` | **Thumbnail** — primary image, shown first everywhere |
| `{slug}2.webp` | **Hover** — shown on card hover in the grid |
| `{slug}3.webp` | Gallery image 3 |
| `{slug}4.webp` | Gallery image 4 |

---

## Step 1 — Install Dependencies

```powershell
cd "D:\N3 Projects\enjoyful\enjoyful_ecom\enjoyful-api"
npm install sharp --save-dev

# or globally for the script
npm install -g sharp-cli
```

---

## Step 2 — Run WebP Conversion + Upload Script

```powershell
cd "D:\N3 Projects\enjoyful\enjoyful_ecom"
$env:CLOUDINARY_CLOUD_NAME = "djejbpz0j"
$env:CLOUDINARY_API_KEY    = "your-api-key"
$env:CLOUDINARY_API_SECRET = "your-api-secret"

npx ts-node product-data/cloudinary-upload.ts
```

The script (`product-data/cloudinary-upload.ts`) will:
1. Walk the local `product-images/` folder
2. Convert every PNG/JPG to WebP using `sharp`
3. Map each file to its Cloudinary folder path using the mapping table below
4. Upload to Cloudinary
5. Write `product-data/cloudinary-urls.json` with every `{localFile: cloudinaryUrl}` mapping

---

## Step 3 — Update MongoDB

After upload, run the DB update script:

```powershell
cd "D:\N3 Projects\enjoyful\enjoyful_ecom\enjoyful-api"
$env:MONGODB_URI = "mongodb+srv://..."
npx ts-node src/database/update-cloudinary-urls.ts
```

This script reads `cloudinary-urls.json` and patches every product's `image`, `hoverImage`, and `images[]` fields with the new Cloudinary URLs.

---

## Step 4 — Reseed Products + Delete Old Cloudinary Folder

```powershell
# Delete old Cloudinary folder (enjoyfull/product-images/*)
# Do this AFTER confirming all new URLs work in the browser

# Reseed categories including new Fragrances category
cd "D:\N3 Projects\enjoyful\enjoyful_ecom\enjoyful-api"
npm run seed
```

---

## File → Cloudinary Path Mapping

This is the exact mapping from local file to Cloudinary folder used by the upload script.

| Local Folder | Cloudinary Path |
|---|---|
| `Almond Lotion/` | `enjoyful/products/daily/body-lotion/almond/` |
| `Aloe Vera Lotion/` | `enjoyful/products/daily/body-lotion/aloevera/` |
| `Mix Fruit Lotion/` | `enjoyful/products/daily/body-lotion/mix-fruit/` |
| `Moisture Balance Lotion/` | `enjoyful/products/daily/body-lotion/moisture-balance/` |
| `Almond Moisturising Cream/` | `enjoyful/products/daily/body-cream/almond/` |
| `Mix Fruit Moisturing Cream/` | `enjoyful/products/daily/body-cream/mix-fruit/` |
| `Daily Delight/` | `enjoyful/products/daily/body-cream/daily-delight/` |
| `Shower Gel/Morning Buzz/` | `enjoyful/products/daily/shower-gel/morning-buzz/` |
| `Shower Gel/Ice Blast/` | `enjoyful/products/daily/shower-gel/ice-blast/` |
| `Shower Gel/Cglow/` | `enjoyful/products/daily/shower-gel/c-glow/` |
| `Shower Gel/aloe bliss/` | `enjoyful/products/daily/shower-gel/aloe-bliss/` |
| `Shampoo/Aloe Calm/` | `enjoyful/products/daily/shampoo/aloe-calm/` |
| `Shampoo/Bamboo balance/` | `enjoyful/products/daily/shampoo/bamboo-balance/` |
| `Shampoo/Botanical Shampoo/` | `enjoyful/products/daily/shampoo/botanical-deep-clean/` |
| `Shampoo/Onion Restore/` | `enjoyful/products/daily/shampoo/onion/` |
| `Hair Oil/` | `enjoyful/products/daily/hair-oil/jasmin/` |
| `Hair Removal Cream/` | `enjoyful/products/daily/hair-removal-cream/` |
| `Face Wash/Lemon Face Wash/150ml/` | `enjoyful/products/glow/face-wash/lemon-vit-c/` |
| `Face Wash/Lemon Face Wash/60ml/` | `enjoyful/products/glow/face-wash/lemon-vit-c/` |
| `Face Wash/Oranage/` | `enjoyful/products/glow/face-wash/orange-vit-c/` |
| `Face Wash/Papaya/` | `enjoyful/products/glow/face-wash/papaya-vit-c/` |
| `Face Wash/Charcoal Face Wash/` | `enjoyful/products/glow/face-wash/charcoal/` |
| `Face Scrub/Coffee Scrub/150ml Mockup/` | `enjoyful/products/glow/face-scrub/coffee/` |
| `Face Scrub/Coffee Scrub/50ml/` | `enjoyful/products/glow/face-scrub/coffee/` |
| `Face Scrub/Walnut/Mockup 50ml/` | `enjoyful/products/glow/face-scrub/walnut/` |
| `Face Scrub/Apricot/Enjoyfullife_Apricot Face Scrub 150ML/Website/` | `enjoyful/products/glow/face-scrub/apricot/` |
| `Face Scrub/Apricot/Enjoyfullife_Apricot Face Scrub 50ML/` | `enjoyful/products/glow/face-scrub/apricot/` |
| `Face Scrub/Enjoyful_Walnut Apricot/150ml/` | `enjoyful/products/glow/face-scrub/walnut-apricot/` |
| `Face Scrub/Enjoyful_Walnut Apricot/50ml Mockup/` | `enjoyful/products/glow/face-scrub/walnut-apricot/` |
| `Peel Off Mask/` | `enjoyful/products/glow/face-mask/peel-off/` |
| `Sunscreen/Mockup/50ml/` | `enjoyful/products/glow/sunscreen/` |
| `Sunscreen/Mockup/150ml/` | `enjoyful/products/glow/sunscreen/` |
| `Aloe Vera Gel/` | `enjoyful/products/glow/aloe-vera-gel/` |
| `Charcoal Face Wash/` | *(duplicate — skip, use Face Wash/Charcoal Face Wash instead)* |
| `Baby/Baby Lotion/` | `enjoyful/products/baby/baby-lotion/` |
| `Cleaning Products/Baby Wash/` | `enjoyful/products/baby/baby-wash/` |
| `Baby/Baby Powder/` | `enjoyful/products/baby/baby-talc/` |
| `Baby/Baby Rash Cream/` | `enjoyful/products/baby/baby-rash-cream/` |
| `Baby/Baby Soap/` | `enjoyful/products/baby/baby-soap/` |
| `Perfume/100ml/Amber Imperial/` | `enjoyful/products/fragrances/perfume-100ml/amber-imperial/` |
| `Perfume/100ml/Amber Ophir/` | `enjoyful/products/fragrances/perfume-100ml/amber-ophir/` |
| `Perfume/100ml/ATLAS OUD/` | `enjoyful/products/fragrances/perfume-100ml/atlas-oud/` |
| `Perfume/100ml/Jasmine Nomade/` | `enjoyful/products/fragrances/perfume-100ml/jasmine-nomade/` |
| `Perfume/100ml/Noir Velours/` | `enjoyful/products/fragrances/perfume-100ml/noir-velours/` |
| `Perfume/100ml/PETAL D'AMICHU/` | `enjoyful/products/fragrances/perfume-100ml/petal-damichu/` |
| `Perfume/100ml/Reine Florale/` | `enjoyful/products/fragrances/perfume-100ml/reine-florale/` |
| `Perfume/100ml/ROYAL SAFRAN/` | `enjoyful/products/fragrances/perfume-100ml/royal-safran/` |
| `Perfume/100ml/Zoya Flora/` | `enjoyful/products/fragrances/perfume-100ml/zoya-flora/` |
| `Perfume/50ml/Cuir Imperial/` | `enjoyful/products/fragrances/perfume-50ml/cuir-imperial/` |
| `Perfume/50ml/EBÈNE NOIR/` | `enjoyful/products/fragrances/perfume-50ml/ebene-noir/` |
| `Perfume/50ml/Gold Victorie/` | `enjoyful/products/fragrances/perfume-50ml/gold-victorie/` |
| `Perfume/50ml/IMPERIUM NOIR/` | `enjoyful/products/fragrances/perfume-50ml/imperium-noir/` |
| `Perfume/50ml/Intense Aibek/` | `enjoyful/products/fragrances/perfume-50ml/intense-aibek/` |
| `Perfume/50ml/Laichu Signature/` | `enjoyful/products/fragrances/perfume-50ml/laichu-signature/` |
| `Perfume/50ml/MINUIT NOIR/` | `enjoyful/products/fragrances/perfume-50ml/minuit-noir/` |
| `Perfume/50ml/MONARACH OUD/` | `enjoyful/products/fragrances/perfume-50ml/monarach-oud/` |
| `Perfume/50ml/Noir Lehan/` | `enjoyful/products/fragrances/perfume-50ml/noir-lehan/` |
| `Perfume/50ml/OBSIDIEN/` | `enjoyful/products/fragrances/perfume-50ml/obsidien/` |
| `Perfume/50ml/OUD PRIVE/` | `enjoyful/products/fragrances/perfume-50ml/oud-prive/` |
| `Perfume/50ml/Safran Intense/` | `enjoyful/products/fragrances/perfume-50ml/safran-intense/` |
| `Body Mist/Amber Glow/` | `enjoyful/products/fragrances/body-mist/amber-glow/` |
| `Body Mist/Blossam/` | `enjoyful/products/fragrances/body-mist/blossom-veil/` |
| `Body Mist/Costal Pulse/` | `enjoyful/products/fragrances/body-mist/coastal-pulse/` |
| `Body Mist/Midnight Velvet/` | `enjoyful/products/fragrances/body-mist/midnight-velvet/` |
| `Body Mist/Noir Element/` | `enjoyful/products/fragrances/body-mist/noir-element/` |
| `Body Mist/Vanila Aura/` | `enjoyful/products/fragrances/body-mist/vanilla-aura/` |
| `Roller/Apex 72/` | `enjoyful/products/fragrances/roll-on/apex-72h/` |
| `Roller/Element Zero/` | `enjoyful/products/fragrances/roll-on/element-zero/` |
| `Roller/Lumi Glow/` | `enjoyful/products/fragrances/roll-on/lumi-glow/` |
| `Roller/Noir Oud/` | `enjoyful/products/fragrances/roll-on/noir-oud/` |
| `Roller/Pure Renewal/` | `enjoyful/products/fragrances/roll-on/pure-renewal/` |
| `Roller/Velvet Repair/` | `enjoyful/products/fragrances/roll-on/velvet-repair/` |

---

## DB Migration: productFamily values to set

After upload, run `update-cloudinary-urls.ts` then also patch these `productFamily` values via the admin product form or a one-off script so the size variant selector works on the product page.

| productFamily slug | Products (name contains) |
|---|---|
| `almond-body-lotion` | Almond Body Lotion 100ml, Almond Body Lotion 350ml |
| `aloevera-body-lotion` | Aloevera Body Lotion 100ml, Aloevera Body Lotion 350ml |
| `mix-fruit-body-lotion` | Mix Fruit Body Lotion 100ml, Mix Fruit Body Lotion 350ml |
| `coffee-face-scrub` | Coffee Face Scrub 150ml, Coffee Face Scrub 50ml |
| `walnut-face-scrub` | Walnut Face Scrub 150ml, Walnut Face Scrub 50ml |
| `apricot-face-scrub` | Apricot Face Scrub 150ml, Apricot Face Scrub 50ml |
| `walnut-apricot-face-scrub` | Walnut Apricot Face Scrub 150ml, Walnut Apricot Face Scrub 50ml |
| `peel-off-mask` | Peel Off Mask 100ml, Peel Off Mask 150ml |
| `sunscreen-cream` | Sunscreen Cream 50ml, Sunscreen Cream 100ml, Sunscreen Cream 150ml |
| `aloevera-gel` | Aloevera Gel 150ml, Aloevera Gel 60ml |
| `rose-water-premium` | Rose Water Premium 100ml, Rose Water Premium 240ml |
| `lemon-face-wash` | Vit C Lemon Face Wash 150ml, Vit C Lemon Face Wash 60ml |
| `orange-face-wash` | Vit C Orange Face Wash 150ml, Vit C Orange Face Wash 60ml |
| `papaya-face-wash` | Vit C Papaya Face Wash 150ml, Vit C Papaya Face Wash 60ml |
| `aloe-calm-shampoo` | Aloe Calm Shampoo 100ml, Aloe Calm Shampoo 400ml |
| `bamboo-balance-shampoo` | Bamboo Balance Shampoo 100ml, Bamboo Balance Shampoo 400ml |
| `botanical-shampoo` | Botanical Deep Clean Shampoo 100ml, Botanical Deep Clean Shampoo 400ml |
| `onion-shampoo` | Onion Shampoo 100ml, Onion Shampoo 400ml |
| `jasmin-oil` | Jasmin Oil 200ml, Jasmin Oil 500ml |
| `baby-lotion` | Baby Lotion 200ml, Baby Lotion 500ml |
| `baby-wash` | Baby Wash 300ml, Baby Wash 500ml |
| `baby-talc` | Baby Talc 200gm, Baby Talc 400gm |
| `baby-rash-cream` | Baby Rash Cream 50ml, Baby Rash Cream 100ml |
| `aloevera-hair-removal-cream` | Aloevera Hair Removal Cream 25gm, Aloevera Hair Removal Cream 60gm |
| `amber-glow-body-mist` | Amber Glow Body Mist 250ml, Amber Glow Body Mist 70ml |
| `blossom-veil-body-mist` | Blossom Veil Body Mist 250ml, Blossom Veil Body Mist 70ml |
| `coastal-pulse-body-mist` | Coastal Pulse Body Mist 250ml, Coastal Pulse Body Mist 70ml |
| `midnight-velvet-body-mist` | Midnight Velvet Body Mist 250ml, Midnight Velvet Body Mist 70ml |
| `noir-element-body-mist` | Noir Element Body Mist 250ml, Noir Element Body Mist 70ml |
| `vanilla-aura-body-mist` | Vanilla Aura Body Mist 250ml, Vanilla Aura Body Mist 70ml |

---

*Generated 2026-06-01*
