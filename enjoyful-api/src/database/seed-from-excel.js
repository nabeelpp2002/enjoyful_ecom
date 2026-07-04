/**
 * Enjoyful Life — Full Product Seed from Excel
 *
 * 1. Ensures all 5 categories exist (Glow, Daily, Baby, Fragrances, Home)
 * 2. Deletes ALL existing products
 * 3. Parses 111 products from the XLSX catalog
 * 4. Inserts them into MongoDB with correct categories + inferred metadata
 * 5. Leaves price=0 (set prices via Admin panel afterwards)
 *
 * Run from enjoyful-api/:
 *   node src/database/seed-from-excel.js
 */
'use strict';

require('dotenv/config');
const mongoose = require('mongoose');
const XLSX     = require('xlsx');
const path     = require('path');

const XLSX_PATH   = path.resolve(__dirname, '..', '..', '..', 'product-data', 'Enjoyful_Life_Products_Full_INCI_with_Benefits.xlsx');
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set in .env'); process.exit(1); }

// ── Mongoose schemas ──────────────────────────────────────────────────────────
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  tintColor: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true },
  description: String, shortDescription: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: String, productType: String, productCode: String,
  size: String, itemForm: String, targetUse: String,
  scent: String, texture: String,
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  discountPct: { type: Number, default: 0 },
  currency: { type: String, default: 'AED' },
  images: [{ url: String, publicId: String, alt: String, isPrimary: Boolean }],
  image: String, hoverImage: String,
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  benefits: [String], ingredients: [String], activeIngredients: [String],
  howToUse: String, recommendedUsage: String, precautions: String,
  skinType: [String], hairType: [String], tags: [String],
  suitableFor: [String], highlights: [String], features: [String],
  keywords: [String], searchTags: [String],
  seoTitle: String, metaDescription: String,
  productFamily: String,
  barcode: { type: String, default: 'Pending Client Confirmation' },
  shelfLife: { type: String, default: 'Pending Client Confirmation' },
  storageInstructions: { type: String, default: 'Pending Client Confirmation' },
  countryOfOrigin: { type: String, default: 'Pending Client Confirmation' },
  brand: { type: String, default: 'Enjoyful Life' },
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });

// ── Categories to seed ────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Glow',       slug: 'glow',       tintColor: '#F0EDF6', sortOrder: 1 },
  { name: 'Daily',      slug: 'daily',      tintColor: '#FBEBE5', sortOrder: 2 },
  { name: 'Baby',       slug: 'baby',       tintColor: '#E6F0F9', sortOrder: 3 },
  { name: 'Fragrances', slug: 'fragrances', tintColor: '#F5EFF8', sortOrder: 4 },
  { name: 'Home',       slug: 'home',       tintColor: '#EAF3EB', sortOrder: 5 },
];

// ── Catalog field inference ───────────────────────────────────────────────────
function inferFields(name) {
  const n = name.toLowerCase();

  if (n.includes('perfume') || n.includes('fragrance') || n.includes('eau de'))
    return { cat: 'Fragrances', sub: 'Perfume', type: 'Perfume', targetUse: 'Body', itemForm: 'Spray', scent: 'Oriental', texture: '', skinType: ['All Skin Types'], suitableFor: ['Men', 'Women'], hairType: [] };
  if (n.includes('body mist'))
    return { cat: 'Fragrances', sub: 'Body Mist', type: 'Body Mist', targetUse: 'Body', itemForm: 'Spray', scent: 'Fresh', texture: 'Lightweight', skinType: ['All Skin Types'], suitableFor: ['Men', 'Women'], hairType: [] };
  if (n.includes('roll on'))
    return { cat: 'Fragrances', sub: 'Roll On', type: 'Roll On', targetUse: 'Body', itemForm: 'Roll-On', scent: 'Fresh', texture: '', skinType: ['All Skin Types'], suitableFor: ['Men', 'Women'], hairType: [] };
  if (n.includes('deo stick') || n.includes('deodorant'))
    return { cat: 'Fragrances', sub: 'Deo Stick', type: 'Deo Stick', targetUse: 'Body', itemForm: 'Stick', scent: 'Fresh', texture: '', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('baby lotion'))
    return { cat: 'Baby', sub: 'Baby Lotion', type: 'Baby Lotion', targetUse: 'Baby Care', itemForm: 'Lotion', scent: 'Unscented', texture: 'Creamy', skinType: ['Sensitive Skin'], suitableFor: ['Babies'], hairType: [] };
  if (n.includes('baby wash'))
    return { cat: 'Baby', sub: 'Baby Wash', type: 'Baby Wash', targetUse: 'Baby Care', itemForm: 'Gel', scent: 'Unscented', texture: 'Gel-Based', skinType: ['Sensitive Skin'], suitableFor: ['Babies'], hairType: [] };
  if (n.includes('baby talc') || n.includes('baby powder'))
    return { cat: 'Baby', sub: 'Baby Talc', type: 'Baby Talc', targetUse: 'Baby Care', itemForm: 'Powder', scent: 'Unscented', texture: '', skinType: ['Sensitive Skin'], suitableFor: ['Babies'], hairType: [] };
  if (n.includes('baby rash'))
    return { cat: 'Baby', sub: 'Baby Rash Cream', type: 'Baby Rash Cream', targetUse: 'Baby Care', itemForm: 'Cream', scent: 'Unscented', texture: 'Creamy', skinType: ['Sensitive Skin'], suitableFor: ['Babies'], hairType: [] };
  if (n.includes('baby soap'))
    return { cat: 'Baby', sub: 'Baby Soap', type: 'Baby Soap', targetUse: 'Baby Care', itemForm: 'Bar', scent: 'Unscented', texture: 'Smooth', skinType: ['Sensitive Skin'], suitableFor: ['Babies'], hairType: [] };
  if (n.includes('foaming face wash') || (n.includes('face wash') && n.includes('foam')))
    return { cat: 'Glow', sub: 'Face Wash', type: 'Foaming Face Wash', targetUse: 'Face', itemForm: 'Foam', scent: 'Fresh', texture: 'Foam', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('face wash'))
    return { cat: 'Glow', sub: 'Face Wash', type: 'Face Wash', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('body scrub') || (n.includes('scrub') && !n.includes('face')))
    return { cat: 'Glow', sub: 'Skin Treatment', type: 'Body Scrub', targetUse: 'Body', itemForm: 'Scrub', scent: 'Floral', texture: 'Smooth', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('face scrub') || n.includes('scrub'))
    return { cat: 'Glow', sub: 'Face Scrub', type: 'Face Scrub', targetUse: 'Face', itemForm: 'Scrub', scent: 'Herbal', texture: 'Smooth', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('peel off') || n.includes('face mask'))
    return { cat: 'Glow', sub: 'Face Mask', type: 'Peel Off Mask', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('sunscreen') || n.includes('spf'))
    return { cat: 'Glow', sub: 'Sunscreen', type: 'Sunscreen Cream', targetUse: 'Face', itemForm: 'Cream', scent: 'Unscented', texture: 'Lightweight', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('aloevera gel') || n.includes('aloe vera gel') || n.includes('aloe gel'))
    return { cat: 'Glow', sub: 'Aloe Vera Gel', type: 'Aloe Vera Gel', targetUse: 'Face', itemForm: 'Gel', scent: 'Herbal', texture: 'Gel-Based', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('rose water') || n.includes('rosewater'))
    return { cat: 'Glow', sub: 'Toner', type: 'Rose Water Toner', targetUse: 'Face', itemForm: 'Spray', scent: 'Floral', texture: 'Lightweight', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('charcoal'))
    return { cat: 'Glow', sub: 'Face Wash', type: 'Charcoal Face Wash', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', skinType: ['Oily Skin', 'Combination Skin'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('hair serum') || n.includes('silky touch'))
    return { cat: 'Daily', sub: 'Hair Serum', type: 'Hair Serum', targetUse: 'Hair', itemForm: 'Serum', scent: 'Fresh', texture: 'Silky', skinType: [], suitableFor: ['All Genders'], hairType: ['All Hair Types'] };
  if (n.includes('hair oil') || n.includes('jasmin oil') || n.includes('jasmine oil'))
    return { cat: 'Daily', sub: 'Hair Oil', type: 'Hair Oil', targetUse: 'Hair', itemForm: 'Oil', scent: 'Floral', texture: 'Silky', skinType: [], suitableFor: ['All Genders'], hairType: ['All Hair Types'] };
  if (n.includes('shampoo'))
    return { cat: 'Daily', sub: 'Shampoo', type: 'Shampoo', targetUse: 'Hair', itemForm: 'Liquid', scent: 'Fresh', texture: 'Creamy', skinType: [], suitableFor: ['All Genders'], hairType: ['All Hair Types'] };
  if (n.includes('hair removal'))
    return { cat: 'Daily', sub: 'Skin Treatment', type: 'Hair Removal Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', skinType: ['All Skin Types'], suitableFor: ['Women'], hairType: [] };
  if (n.includes('shower gel'))
    return { cat: 'Daily', sub: 'Shower Gel', type: 'Shower Gel', targetUse: 'Body', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('intimate wash'))
    return { cat: 'Daily', sub: 'Intimate Wash', type: 'Intimate Wash', targetUse: 'Body', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', skinType: ['Sensitive Skin'], suitableFor: ['Women'], hairType: [] };
  if (n.includes('body lotion') || (n.includes('lotion') && !n.includes('baby')))
    return { cat: 'Daily', sub: 'Body Lotion', type: 'Body Lotion', targetUse: 'Body', itemForm: 'Lotion', scent: 'Fresh', texture: 'Creamy', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  if (n.includes('body cream') || n.includes('moisturising cream') || n.includes('moisturizing cream') || n.includes('nourish') || n.includes('repair') || n.includes('daily delight'))
    return { cat: 'Daily', sub: 'Body Cream', type: 'Body Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
  // fallback
  return { cat: 'Daily', sub: 'Body Cream', type: 'Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', skinType: ['All Skin Types'], suitableFor: ['All Genders'], hairType: [] };
}

// Extract size from item name (e.g. "100ml", "350gm", "75gm")
function extractSize(name) {
  const m = name.match(/(\d+\s*(?:ml|gm|g|l|kg))/i);
  return m ? m[1].replace(/\s+/g, '') : '';
}

// Clean product name: strip brand prefix and pack count suffix
function cleanName(raw) {
  return raw
    .replace(/^Enjoyful Life\s*/i, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim();
}

// Active ingredient keywords
const ACTIVE_KEYWORDS = [
  'aloe', 'glycerin', 'hyaluronic', 'niacinamide', 'vitamin c', 'ascorbic', 'sodium ascorbyl',
  'vitamin e', 'tocopherol', 'zinc oxide', 'retinol', 'salicylic', 'lactic acid',
  'caffeine', 'argan', 'argania', 'coconut', 'cocos', 'jojoba', 'simmondsia',
  'rose', 'rosa', 'almond', 'prunus', 'walnut', 'juglans', 'onion', 'allium',
  'bamboo', 'keratin', 'panthenol', 'biotin', 'collagen', 'jasmine', 'jasminum',
  'coffee', 'coffea', 'charcoal', 'papaya', 'carica', 'citrus', 'sodium hyaluronate',
  'centella', 'titanium dioxide', 'thioglycolic', 'cocamidopropyl',
];
function extractActives(ingredientList) {
  return ingredientList.filter(ing => {
    const l = ing.toLowerCase();
    return ACTIVE_KEYWORDS.some(kw => l.includes(kw));
  });
}

// Slug generator with counter (called async to check DB)
function makeBaseSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// productFamily patching
const FAMILY_MAP = [
  ['almond body lotion',             'almond-body-lotion'],
  ['aloevera body lotion',           'aloevera-body-lotion'],
  ['mix fruit body lotion',          'mix-fruit-body-lotion'],
  ['coffee face scrub',              'coffee-face-scrub'],
  ['walnut apricot face scrub',      'walnut-apricot-face-scrub'],
  ['walnut face scrub',              'walnut-face-scrub'],
  ['apricot face scrub',             'apricot-face-scrub'],
  ['peel off mask',                  'peel-off-mask'],
  ['sunscreen cream',                'sunscreen-cream'],
  ['aloevera gel',                   'aloevera-gel'],
  ['rose water',                     'rose-water-premium'],
  ['vit c lemon face wash',          'lemon-face-wash'],
  ['vit c orange face wash',         'orange-face-wash'],
  ['vit c papaya face wash',         'papaya-face-wash'],
  ['vit c foaming face wash',        'foaming-face-wash'],
  ['charcoal face wash',             'charcoal-face-wash'],
  ['aloe calm shampoo',              'aloe-calm-shampoo'],
  ['bamboo balance shampoo',         'bamboo-balance-shampoo'],
  ['botanical deep clean shampoo',   'botanical-shampoo'],
  ['onion shampoo',                  'onion-shampoo'],
  ['jasmin oil',                     'jasmin-oil'],
  ['baby lotion',                    'baby-lotion'],
  ['baby wash',                      'baby-wash'],
  ['baby talc',                      'baby-talc'],
  ['baby rash cream',                'baby-rash-cream'],
  ['baby soap',                      'baby-soap'],
  ['aloevera hair removal cream',    'aloevera-hair-removal-cream'],
  ['amber glow body mist',           'amber-glow-body-mist'],
  ['blossom veil body mist',         'blossom-veil-body-mist'],
  ['coastal pulse body mist',        'coastal-pulse-body-mist'],
  ['midnight velvet body mist',      'midnight-velvet-body-mist'],
  ['noir element body mist',         'noir-element-body-mist'],
  ['vanilla aura body mist',         'vanilla-aura-body-mist'],
  ['apex 72h roll on',               'apex-72h-roll-on'],
  ['element zero roll on',           'element-zero-roll-on'],
  ['lumi glow roll on',              'lumi-glow-roll-on'],
  ['noir oud roll on',               'noir-oud-roll-on'],
  ['pure renewal roll on',           'pure-renewal-roll-on'],
  ['velvet repair roll on',          'velvet-repair-roll-on'],
  ['pure fresh deo stick',           'pure-fresh-deo-stick'],
  ['silk bloom deo stick',           'silk-bloom-deo-stick'],
  ['ultra fresh deo stick',          'ultra-fresh-deo-stick'],
  ['aloe bliss shower gel',          'aloe-bliss-shower-gel'],
  ['c glow shower gel',              'c-glow-shower-gel'],
  ['ice blast shower gel',           'ice-blast-shower-gel'],
  ['morning buzz shower gel',        'morning-buzz-shower-gel'],
  ['silky touch hair serum',         'silky-touch-hair-serum'],
  ['intimate wash',                  'intimate-wash'],
  ['nourish plus body cream',        'nourish-plus-body-cream'],
  ['repair plus body cream',         'repair-plus-body-cream'],
  ['roseradiance body scrub',        'roseradiance-body-scrub'],
  ['sapphire night body scrub',      'sapphire-night-body-scrub'],
  ['moisture balance body lotion',   'moisture-balance-body-lotion'],
  ['daily delight moisturising cream', 'daily-delight-cream'],
  ['almond moisturising cream',      'almond-moisturising-cream'],
  ['mix fruit moisturising cream',   'mix-fruit-moisturising-cream'],
];

function getFamily(name) {
  const n = name.toLowerCase().replace('enjoyful life ', '');
  for (const [keyword, family] of FAMILY_MAP) {
    if (n.includes(keyword)) return family;
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const CategoryModel = mongoose.model('Category', CategorySchema);
  const ProductModel  = mongoose.model('Product',  ProductSchema);

  // ── 1. Seed categories ────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const catMap = {};
  for (const cat of CATEGORIES) {
    let existing = await CategoryModel.findOne({ slug: cat.slug });
    if (!existing) {
      existing = await CategoryModel.create(cat);
      console.log(`  ✅ Created: ${cat.name}`);
    } else {
      console.log(`  ℹ️  Exists:  ${cat.name}`);
    }
    catMap[cat.name] = existing._id;
  }

  // ── 2. Delete existing products ───────────────────────────────────────────
  console.log('\n🗑️  Deleting all existing products...');
  const { deletedCount } = await ProductModel.deleteMany({});
  console.log(`   Deleted ${deletedCount} products\n`);

  // ── 3. Parse Excel ────────────────────────────────────────────────────────
  console.log('📊 Reading Excel file...');
  const wb   = XLSX.readFile(XLSX_PATH);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`   ${rows.length} rows found\n`);

  // ── 4. Insert products ────────────────────────────────────────────────────
  console.log('🌱 Inserting products...');
  let created = 0, failed = 0;
  const slugCounts = {};

  for (const row of rows) {
    const code      = (row['Code'] || '').toString().trim();
    const itemName  = (row['Item Name'] || '').toString().trim();
    const ingRaw    = (row['Ingredients '] || row['Ingredients'] || '').toString().trim();
    const benRaw    = (row['benifits'] || row['benefits'] || row['Benefits'] || '').toString().trim();

    if (!itemName) continue;

    const size    = extractSize(itemName);
    const clean   = cleanName(itemName);
    const fields  = inferFields(clean);
    const catId   = catMap[fields.cat];

    if (!catId) { console.log(`  ⚠️  No category for: ${clean}`); failed++; continue; }

    // Parse benefits bullet list
    const benefits = benRaw
      .split('\n')
      .map(b => b.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    // Parse ingredients
    const ingredients = ingRaw.split(',').map(s => s.trim()).filter(Boolean);
    const activeIngredients = extractActives(ingredients);

    // Unique slug
    const base = makeBaseSlug(`enjoyful-life-${clean}`);
    slugCounts[base] = (slugCounts[base] || 0) + 1;
    const slug = slugCounts[base] > 1 ? `${base}-${slugCounts[base]}` : base;

    const productFamily = getFamily(clean);

    // SEO defaults
    const seoTitle       = `${clean} | ${fields.sub} | Enjoyful Life`.slice(0, 60);
    const metaDescription = `${clean} by Enjoyful Life. Premium ${fields.type.toLowerCase()} for ${fields.targetUse.toLowerCase()}. Shop online in UAE & UK.`.slice(0, 160);
    const searchTags     = [fields.sub.toLowerCase(), fields.type.toLowerCase(), fields.cat.toLowerCase(), 'enjoyful life', size.toLowerCase()].filter(Boolean);
    const keywords       = [clean.toLowerCase(), fields.sub.toLowerCase(), `${fields.sub.toLowerCase()} uae`, `buy ${fields.type.toLowerCase()} online`];

    try {
      await ProductModel.create({
        name:             `Enjoyful Life ${clean}`,
        slug,
        productCode:      code,
        category:         catId,
        subcategory:      fields.sub,
        productType:      fields.type,
        size,
        itemForm:         fields.itemForm,
        targetUse:        fields.targetUse,
        scent:            fields.scent,
        texture:          fields.texture,
        brand:            'Enjoyful Life',
        price:            0,
        currency:         'AED',
        benefits,
        ingredients,
        activeIngredients,
        skinType:         fields.skinType,
        hairType:         fields.hairType,
        suitableFor:      fields.suitableFor,
        productFamily,
        seoTitle,
        metaDescription,
        searchTags,
        keywords,
        tags:             searchTags,
        barcode:          'Pending Client Confirmation',
        shelfLife:        'Pending Client Confirmation',
        storageInstructions: 'Pending Client Confirmation',
        countryOfOrigin:  'Pending Client Confirmation',
        stock:            0,
        isActive:         true,
        isFeatured:       false,
        isHidden:         false,
      });
      console.log(`  ✅ [${code}] ${`Enjoyful Life ${clean}`.slice(0, 65)}`);
      created++;
    } catch (err) {
      console.log(`  ❌ [${code}] ${clean}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Created: ${created} products`);
  if (failed) console.log(`❌ Failed:  ${failed} products`);
  console.log(`\n📌 All products seeded with price=0 and no images.`);
  console.log(`   Next steps:`);
  console.log(`   1. node src/database/patch-mongodb-urls.js    ← attach Cloudinary images`);
  console.log(`   2. Set prices via Admin → Products`);
  console.log(`   3. Run enrich-catalog.ts to generate AI descriptions`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
