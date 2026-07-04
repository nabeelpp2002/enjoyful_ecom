/**
 * Enjoyful Life — MongoDB Image Patch (Precise Version)
 *
 * Uses an exact product-name → Cloudinary-folder mapping so every product
 * gets ONLY its own images — no cross-contamination between similar products.
 *
 * Run from enjoyful-api/:
 *   node src/database/patch-mongodb-urls.js
 */
'use strict';

require('dotenv/config');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const URL_MAP_PATH = path.resolve(__dirname, '..', '..', '..', 'product-data', 'cloudinary-urls.json');
const MONGODB_URI  = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, image: String, hoverImage: String,
  images: [{ url: String, publicId: String, alt: String, isPrimary: Boolean }],
  productFamily: String,
}, { strict: false });
const ProductModel = mongoose.model('Product', ProductSchema);

// ── productFamily patches ─────────────────────────────────────────────────────
const FAMILY_PATCHES = [
  ['Almond Body Lotion',              'almond-body-lotion'],
  ['Aloevera Body Lotion',            'aloevera-body-lotion'],
  ['Mix Fruit Body Lotion',           'mix-fruit-body-lotion'],
  ['Coffee Face Scrub',               'coffee-face-scrub'],
  ['Walnut Apricot Face Scrub',       'walnut-apricot-face-scrub'],
  ['Walnut Face Scrub',               'walnut-face-scrub'],
  ['Apricot Face Scrub',              'apricot-face-scrub'],
  ['Peel Off Mask',                   'peel-off-mask'],
  ['Sunscreen Cream',                 'sunscreen-cream'],
  ['Aloevera Gel',                    'aloevera-gel'],
  ['Rose Water',                      'rose-water-premium'],
  ['Vit C Lemon Face Wash',           'lemon-face-wash'],
  ['Vit C Orange Face Wash',          'orange-face-wash'],
  ['Vit C Papaya Face Wash',          'papaya-face-wash'],
  ['Vit C Foaming Face Wash',         'foaming-face-wash'],
  ['Charcoal Face Wash',              'charcoal-face-wash'],
  ['Aloe Calm Shampoo',               'aloe-calm-shampoo'],
  ['Bamboo Balance Shampoo',          'bamboo-balance-shampoo'],
  ['Botanical Deep Clean Shampoo',    'botanical-shampoo'],
  ['Onion Shampoo',                   'onion-shampoo'],
  ['Jasmin Oil',                      'jasmin-oil'],
  ['Baby Lotion',                     'baby-lotion'],
  ['Baby Wash',                       'baby-wash'],
  ['Baby Talc',                       'baby-talc'],
  ['Baby Rash Cream',                 'baby-rash-cream'],
  ['Baby Soap',                       'baby-soap'],
  ['Aloevera Hair Removal Cream',     'aloevera-hair-removal-cream'],
  ['Amber Glow Body Mist',            'amber-glow-body-mist'],
  ['Blossom Veil Body Mist',          'blossom-veil-body-mist'],
  ['Coastal Pulse Body Mist',         'coastal-pulse-body-mist'],
  ['Midnight Velvet Body Mist',       'midnight-velvet-body-mist'],
  ['Noir Element Body Mist',          'noir-element-body-mist'],
  ['Vanilla Aura Body Mist',          'vanilla-aura-body-mist'],
  ['Apex 72H Roll On',                'apex-72h-roll-on'],
  ['Element Zero Roll On',            'element-zero-roll-on'],
  ['Lumi Glow Roll On',               'lumi-glow-roll-on'],
  ['Noir Oud Roll On',                'noir-oud-roll-on'],
  ['Pure Renewal Roll On',            'pure-renewal-roll-on'],
  ['Velvet Repair Roll On',           'velvet-repair-roll-on'],
  ['Aloe Bliss Shower Gel',           'aloe-bliss-shower-gel'],
  ['C Glow Shower Gel',               'c-glow-shower-gel'],
  ['Ice Blast Shower Gel',            'ice-blast-shower-gel'],
  ['Morning Buzz Shower Gel',         'morning-buzz-shower-gel'],
  ['Silky Touch Hair Serum',          'silky-touch-hair-serum'],
  ['Intimate Wash',                   'intimate-wash'],
  ['Nourish Plus Body Cream',         'nourish-plus-body-cream'],
  ['Repair Plus Body Cream',          'repair-plus-body-cream'],
  ['Roseradiance Body Scrub',         'roseradiance-body-scrub'],
  ['Sapphire Night Body Scrub',       'sapphire-night-body-scrub'],
  ['Moisture Balance Body Lotion',    'moisture-balance-body-lotion'],
  ['Daily Delight Moisturising Cream','daily-delight-cream'],
  ['Almond Moisturising Cream',       'almond-moisturising-cream'],
  ['Mix Fruit Moisturising Cream',    'mix-fruit-moisturising-cream'],
  ['Amber Imperial',                  'amber-imperial-perfume'],
  ['Amber Nocturne',                  'amber-nocturne-perfume'],
  ['Amber Ophir',                     'amber-ophir-perfume'],
  ['Atlas Oud',                       'atlas-oud-perfume'],
  ['Benz Lumiere',                    'benz-lumiere-perfume'],
  ['Jasmine Nomade',                  'jasmine-nomade-perfume'],
  ['Noir Velours',                    'noir-velours-perfume'],
  ['Petal D Aamichu',                 'petal-damichu-perfume'],
  ['Reine Florale',                   'reine-florale-perfume'],
  ['Royal Eclat',                     'royal-eclat-perfume'],
  ['Royal Safran',                    'royal-safran-perfume'],
  ['Zoya Flora',                      'zoya-flora-perfume'],
  ['Cuir Imperial',                   'cuir-imperial-perfume'],
  ['Ebene Noir',                      'ebene-noir-perfume'],
  ['Gold Victorie',                   'gold-victorie-perfume'],
  ['Imperium Noir',                   'imperium-noir-perfume'],
  ['Intense Aibek',                   'intense-aibek-perfume'],
  ['Laichu Signature',                'laichu-signature-perfume'],
  ['Minuit Noir',                     'minuit-noir-perfume'],
  ['Monarach Oud',                    'monarach-oud-perfume'],
  ['Noir Lehan',                      'noir-lehan-perfume'],
  ['Obsidien',                        'obsidien-perfume'],
  ['Oud Prive',                       'oud-prive-perfume'],
  ['Safran Intense',                  'safran-intense-perfume'],
  ['Pure Fresh Deo Stick',            'pure-fresh-deo-stick'],
  ['Silk Bloom Deo Stick',            'silk-bloom-deo-stick'],
  ['Ultra Fresh Deo Stick',           'ultra-fresh-deo-stick'],
];

// ── EXACT product-name → Cloudinary folder path ───────────────────────────────
// Key = substring of product name (case-insensitive, checked with .includes)
// Value = EXACT Cloudinary folder path segment that must appear in the URL
// Order matters: more specific entries first to prevent partial matches
const EXACT_FOLDER_MAP = [
  // ── Face Wash — most specific first ──────────────────────────────
  ['Vit C Lemon Face Wash',           'glow/face-wash/lemon-vit-c'],
  ['Vit C Orange Face Wash',          'glow/face-wash/orange-vit-c'],
  ['Vit C Papaya Face Wash',          'glow/face-wash/papaya-vit-c'],
  ['Charcoal Face Wash',              'glow/face-wash/charcoal'],
  // Foaming Face Wash has NO images — no entry, will skip cleanly
  // ── Face Scrub — walnut-apricot BEFORE walnut and apricot ────────
  ['Walnut Apricot Face Scrub',       'glow/face-scrub/walnut-apricot'],
  ['Walnut Face Scrub',               'glow/face-scrub/walnut'],
  ['Apricot Face Scrub',              'glow/face-scrub/apricot'],
  ['Coffee Face Scrub',               'glow/face-scrub/coffee'],
  // ── Other Glow ───────────────────────────────────────────────────
  ['Peel Off Mask',                   'glow/face-mask/peel-off'],
  ['Sunscreen Cream',                 'glow/sunscreen'],
  ['Aloevera Gel',                    'glow/aloe-vera-gel'],
  // ── Daily — Body Lotion ──────────────────────────────────────────
  ['Almond Body Lotion',              'daily/body-lotion/almond'],
  ['Aloevera Body Lotion',            'daily/body-lotion/aloevera'],
  ['Mix Fruit Body Lotion',           'daily/body-lotion/mix-fruit'],
  ['Moisture Balance Body Lotion',    'daily/body-lotion/moisture-balance'],
  // ── Daily — Body Cream ───────────────────────────────────────────
  ['Almond Moisturising Cream',       'daily/body-cream/almond'],
  ['Mix Fruit Moisturising Cream',    'daily/body-cream/mix-fruit'],
  ['Daily Delight Moisturising Cream','daily/body-cream/daily-delight'],
  // ── Daily — Shower Gel ───────────────────────────────────────────
  ['Morning Buzz Shower Gel',         'daily/shower-gel/morning-buzz'],
  ['Ice Blast Shower Gel',            'daily/shower-gel/ice-blast'],
  ['C Glow Shower Gel',               'daily/shower-gel/c-glow'],
  ['Aloe Bliss Shower Gel',           'daily/shower-gel/aloe-bliss'],
  // ── Daily — Shampoo ──────────────────────────────────────────────
  ['Aloe Calm Shampoo',               'daily/shampoo/aloe-calm'],
  ['Bamboo Balance Shampoo',          'daily/shampoo/bamboo-balance'],
  ['Botanical Deep Clean Shampoo',    'daily/shampoo/botanical-deep-clean'],
  ['Onion Shampoo',                   'daily/shampoo/onion'],
  // ── Daily — Hair ─────────────────────────────────────────────────
  ['Jasmin Oil',                      'daily/hair-oil/jasmin'],
  ['Aloevera Hair Removal Cream',     'daily/hair-removal-cream'],
  // ── Baby ─────────────────────────────────────────────────────────
  ['Baby Lotion',                     'baby/baby-lotion'],
  ['Baby Wash',                       'baby/baby-wash'],
  ['Baby Talc',                       'baby/baby-talc'],
  ['Baby Rash Cream',                 'baby/baby-rash-cream'],
  ['Baby Soap',                       'baby/baby-soap'],
  // ── Fragrances — Body Mist ───────────────────────────────────────
  ['Amber Glow Body Mist',            'fragrances/body-mist/amber-glow'],
  ['Blossom Veil Body Mist',          'fragrances/body-mist/blossom-veil'],
  ['Coastal Pulse Body Mist',         'fragrances/body-mist/coastal-pulse'],
  ['Midnight Velvet Body Mist',       'fragrances/body-mist/midnight-velvet'],
  ['Noir Element Body Mist',          'fragrances/body-mist/noir-element'],
  ['Vanilla Aura Body Mist',          'fragrances/body-mist/vanilla-aura'],
  // ── Fragrances — Roll On ─────────────────────────────────────────
  ['Apex 72H Roll On',                'fragrances/roll-on/apex-72h'],
  ['Element Zero Roll On',            'fragrances/roll-on/element-zero'],
  ['Lumi Glow Roll On',               'fragrances/roll-on/lumi-glow'],
  ['Noir Oud Roll On',                'fragrances/roll-on/noir-oud'],
  ['Pure Renewal Roll On',            'fragrances/roll-on/pure-renewal'],
  ['Velvet Repair Roll On',           'fragrances/roll-on/velvet-repair'],
  // ── Fragrances — Perfume 100ml ───────────────────────────────────
  ['Amber Imperial Fragrances',       'fragrances/perfume-100ml/amber-imperial'],
  ['Amber Nocturne Fragrances',       'fragrances/perfume-100ml/amber-nocturne'],
  ['Amber Ophir Fragrances',          'fragrances/perfume-100ml/amber-ophir'],
  ['Atlas Oud Fragrances',            'fragrances/perfume-100ml/atlas-oud'],
  ['Benz Lumiere Fragrances',         'fragrances/perfume-100ml/benz-lumiere'],
  ['Jasmine Nomade Fragrances',       'fragrances/perfume-100ml/jasmine-nomade'],
  ['Noir Velours Fragrances',         'fragrances/perfume-100ml/noir-velours'],
  ['Petal D Aamichu Fragrances',      'fragrances/perfume-100ml/petal-damichu'],
  ['Reine Florale Fragrances',        'fragrances/perfume-100ml/reine-florale'],
  ['Royal Eclat Fragrances',          'fragrances/perfume-100ml/royal-eclat'],
  ['Royal Safran Fragrances',         'fragrances/perfume-100ml/royal-safran'],
  ['Zoya Flora Fragrances',           'fragrances/perfume-100ml/zoya-flora'],
  // ── Fragrances — Perfume 50ml ────────────────────────────────────
  ['Cuir Imperial Fragrances',        'fragrances/perfume-50ml/cuir-imperial'],
  ['Ebene Noir Fragrances',           'fragrances/perfume-50ml/ebene-noir'],
  ['Gold Victorie Fragrances',        'fragrances/perfume-50ml/gold-victorie'],
  ['Imperium Noir Fragrances',        'fragrances/perfume-50ml/imperium-noir'],
  ['Intense Aibek Fragrances',        'fragrances/perfume-50ml/intense-aibek'],
  ['Laichu Signature Fragrances',     'fragrances/perfume-50ml/laichu-signature'],
  ['Minuit Noir Fragrances',          'fragrances/perfume-50ml/minuit-noir'],
  ['Monarach Oud Fragrances',         'fragrances/perfume-50ml/monarach-oud'],
  ['Noir Lehan Fragrances',           'fragrances/perfume-50ml/noir-lehan'],
  ['Obsidien Fragrances',             'fragrances/perfume-50ml/obsidien'],
  ['Oud Prive Fragrances',            'fragrances/perfume-50ml/oud-prive'],
  ['Safran Intense Fragrances',       'fragrances/perfume-50ml/safran-intense'],
];

// Get all Cloudinary URLs that belong to a specific folder path
function urlsForFolder(allUrls, folderPath) {
  return allUrls.filter(url => url.includes(`/products/${folderPath}/`));
}

// Find the exact Cloudinary folder for a product name
function getFolderForProduct(productName) {
  const n = productName.toLowerCase().replace('enjoyful life ', '');
  for (const [nameFragment, folderPath] of EXACT_FOLDER_MAP) {
    if (n.includes(nameFragment.toLowerCase())) {
      return folderPath;
    }
  }
  return null;
}

// Sort URLs: thumbnail (21) first, then others numerically
function sortUrls(urls) {
  return [...urls].sort((a, b) => {
    const aThumb = /\/[^/]+21[^/]*$/.test(a);
    const bThumb = /\/[^/]+21[^/]*$/.test(b);
    if (aThumb && !bThumb) return -1;
    if (!aThumb && bThumb) return 1;
    return a.localeCompare(b);
  });
}

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // ── STEP 1: Set productFamily ────────────────────────────────────────────
  console.log('📦 Setting productFamily...');
  let familyCount = 0;
  for (const [nameContains, family] of FAMILY_PATCHES) {
    const escaped = nameContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Anchor to the start of the name ("Enjoyful Life {clean}…") so e.g.
    // "Apricot Face Scrub" does NOT also match "Walnut Apricot Face Scrub".
    const res = await ProductModel.updateMany(
      { name: { $regex: `^Enjoyful Life ${escaped}`, $options: 'i' } },
      { $set: { productFamily: family } }
    );
    if (res.modifiedCount > 0) {
      console.log(`  ✅ "${nameContains}" (${res.modifiedCount}) → ${family}`);
      familyCount += res.modifiedCount;
    }
  }
  console.log(`   ${familyCount} products updated with productFamily\n`);

  // ── STEP 2: Attach Cloudinary images ────────────────────────────────────
  if (!fs.existsSync(URL_MAP_PATH)) {
    console.log('⚠️  cloudinary-urls.json not found — skipping image patch.');
    await mongoose.disconnect(); return;
  }

  const urlMap  = JSON.parse(fs.readFileSync(URL_MAP_PATH, 'utf8'));
  const allUrls = Object.values(urlMap);
  console.log(`🖼  Loaded ${allUrls.length} Cloudinary URLs`);

  const products = await ProductModel.find({}).lean();
  console.log(`   Scanning ${products.length} products...\n`);

  let matched = 0, skipped = 0;

  for (const product of products) {
    const folder = getFolderForProduct(product.name);

    if (!folder) {
      // No images exist for this product yet — leave image fields empty
      console.log(`  ⚪ No images: ${product.name.slice(0, 60)}`);
      skipped++;
      continue;
    }

    const matching = sortUrls(urlsForFolder(allUrls, folder));

    if (matching.length === 0) {
      console.log(`  ⚠️  Folder mapped but no URLs found: ${folder}`);
      skipped++;
      continue;
    }

    const images = matching.map((url, i) => ({
      url,
      publicId: url.split('/upload/')[1]?.replace(/\.\w+$/, '') ?? '',
      alt: product.name,
      isPrimary: i === 0,
    }));

    await ProductModel.findByIdAndUpdate(product._id, {
      $set: {
        image:      matching[0],
        hoverImage: matching[1] ?? matching[0],
        images,
      },
    });
    console.log(`  ✅ ${product.name.slice(0, 60).padEnd(60)} — ${matching.length} image(s)`);
    matched++;
  }

  console.log(`\n${'─'.repeat(65)}`);
  console.log(`✅ Images attached: ${matched} products`);
  console.log(`⚪ No images yet:   ${skipped} products (will show placeholder)`);
  console.log('\n🎉 Done! All images are now correctly assigned.');
  await mongoose.disconnect();
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
