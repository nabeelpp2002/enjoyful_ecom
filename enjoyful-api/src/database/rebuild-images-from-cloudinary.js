/**
 * Enjoyful Life — Rebuild Product Images from Cloudinary
 *
 * 1. Clears all image fields (image, hoverImage, images[]) from every product
 * 2. Fetches every file under enjoyful/products/ from Cloudinary API
 * 3. Groups them by folder path
 * 4. Matches each product to its exact Cloudinary folder
 * 5. Saves the correct URLs back to MongoDB
 *
 * No local JSON files needed — source of truth is Cloudinary itself.
 *
 * Run from enjoyful-api/:
 *   node src/database/rebuild-images-from-cloudinary.js
 */

'use strict';

require('dotenv/config');
const { v2: cloudinary } = require('cloudinary');
const mongoose = require('mongoose');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dk9mwcx68',
  api_key:    process.env.CLOUDINARY_API_KEY    || '152899332391665',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'wjm6TG1iLqMBBlznvAsqIFS12Wo',
  secure: true,
});

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const ProductSchema = new mongoose.Schema({
  name: String, slug: String,
  image: String, hoverImage: String,
  images: [{ url: String, publicId: String, alt: String, isPrimary: Boolean }],
  productFamily: String,
}, { strict: false });
const ProductModel = mongoose.model('Product', ProductSchema);

// ── Exact product-name fragment → Cloudinary sub-folder ──────────────────────
// Checked in ORDER — more specific entries first to prevent partial match bleed.
// The folder value must match the path segment AFTER "enjoyful/products/"
const PRODUCT_FOLDER_MAP = [
  // GLOW — Face Wash (specific variants before generic)
  ['Vit C Lemon Face Wash',            'glow/face-wash/lemon-vit-c'],
  ['Vit C Orange Face Wash',           'glow/face-wash/orange-vit-c'],
  ['Vit C Papaya Face Wash',           'glow/face-wash/papaya-vit-c'],
  ['Charcoal Face Wash',               'glow/face-wash/charcoal'],
  // GLOW — Face Scrub (walnut-apricot before walnut and apricot individually)
  ['Walnut Apricot Face Scrub',        'glow/face-scrub/walnut-apricot'],
  ['Walnut Face Scrub',                'glow/face-scrub/walnut'],
  ['Apricot Face Scrub',               'glow/face-scrub/apricot'],
  ['Coffee Face Scrub',                'glow/face-scrub/coffee'],
  // GLOW — Other
  ['Peel Off Mask',                    'glow/face-mask/peel-off'],
  ['Sunscreen Cream',                  'glow/sunscreen'],
  ['Aloevera Gel',                     'glow/aloe-vera-gel'],
  // DAILY — Body Lotion
  ['Almond Body Lotion',               'daily/body-lotion/almond'],
  ['Aloevera Body Lotion',             'daily/body-lotion/aloevera'],
  ['Mix Fruit Body Lotion',            'daily/body-lotion/mix-fruit'],
  ['Moisture Balance Body Lotion',     'daily/body-lotion/moisture-balance'],
  // DAILY — Body Cream (Almond Moisturising before Almond Body Lotion is separate above)
  ['Almond Moisturising Cream',        'daily/body-cream/almond'],
  ['Mix Fruit Moisturising Cream',     'daily/body-cream/mix-fruit'],
  ['Daily Delight Moisturising Cream', 'daily/body-cream/daily-delight'],
  // DAILY — Shower Gel
  ['Morning Buzz Shower Gel',          'daily/shower-gel/morning-buzz'],
  ['Ice Blast Shower Gel',             'daily/shower-gel/ice-blast'],
  ['C Glow Shower Gel',                'daily/shower-gel/c-glow'],
  ['Aloe Bliss Shower Gel',            'daily/shower-gel/aloe-bliss'],
  // DAILY — Shampoo
  ['Aloe Calm Shampoo',                'daily/shampoo/aloe-calm'],
  ['Bamboo Balance Shampoo',           'daily/shampoo/bamboo-balance'],
  ['Botanical Deep Clean Shampoo',     'daily/shampoo/botanical-deep-clean'],
  ['Onion Shampoo',                    'daily/shampoo/onion'],
  // DAILY — Hair & Other
  ['Jasmin Oil',                       'daily/hair-oil/jasmin'],
  ['Aloevera Hair Removal Cream',      'daily/hair-removal-cream'],
  // BABY
  ['Baby Lotion',                      'baby/baby-lotion'],
  ['Baby Wash',                        'baby/baby-wash'],
  ['Baby Talc',                        'baby/baby-talc'],
  ['Baby Rash Cream',                  'baby/baby-rash-cream'],
  ['Baby Soap',                        'baby/baby-soap'],
  // FRAGRANCES — Body Mist
  ['Amber Glow Body Mist',             'fragrances/body-mist/amber-glow'],
  ['Blossom Veil Body Mist',           'fragrances/body-mist/blossom-veil'],
  ['Coastal Pulse Body Mist',          'fragrances/body-mist/coastal-pulse'],
  ['Midnight Velvet Body Mist',        'fragrances/body-mist/midnight-velvet'],
  ['Noir Element Body Mist',           'fragrances/body-mist/noir-element'],
  ['Vanilla Aura Body Mist',           'fragrances/body-mist/vanilla-aura'],
  // FRAGRANCES — Roll On
  ['Apex 72H Roll On',                 'fragrances/roll-on/apex-72h'],
  ['Element Zero Roll On',             'fragrances/roll-on/element-zero'],
  ['Lumi Glow Roll On',                'fragrances/roll-on/lumi-glow'],
  ['Noir Oud Roll On',                 'fragrances/roll-on/noir-oud'],
  ['Pure Renewal Roll On',             'fragrances/roll-on/pure-renewal'],
  ['Velvet Repair Roll On',            'fragrances/roll-on/velvet-repair'],
  // FRAGRANCES — Perfume 100ml
  ['Amber Imperial Fragrances',        'fragrances/perfume-100ml/amber-imperial'],
  ['Amber Nocturne Fragrances',        'fragrances/perfume-100ml/amber-nocturne'],
  ['Amber Ophir Fragrances',           'fragrances/perfume-100ml/amber-ophir'],
  ['Atlas Oud Fragrances',             'fragrances/perfume-100ml/atlas-oud'],
  ['Benz Lumiere Fragrances',          'fragrances/perfume-100ml/benz-lumiere'],
  ['Jasmine Nomade Fragrances',        'fragrances/perfume-100ml/jasmine-nomade'],
  ['Noir Velours Fragrances',          'fragrances/perfume-100ml/noir-velours'],
  ['Petal D Aamichu Fragrances',       'fragrances/perfume-100ml/petal-damichu'],
  ['Reine Florale Fragrances',         'fragrances/perfume-100ml/reine-florale'],
  ['Royal Eclat Fragrances',           'fragrances/perfume-100ml/royal-eclat'],
  ['Royal Safran Fragrances',          'fragrances/perfume-100ml/royal-safran'],
  ['Zoya Flora Fragrances',            'fragrances/perfume-100ml/zoya-flora'],
  // FRAGRANCES — Perfume 50ml
  ['Cuir Imperial Fragrances',         'fragrances/perfume-50ml/cuir-imperial'],
  ['Ebene Noir Fragrances',            'fragrances/perfume-50ml/ebene-noir'],
  ['Gold Victorie Fragrances',         'fragrances/perfume-50ml/gold-victorie'],
  ['Imperium Noir Fragrances',         'fragrances/perfume-50ml/imperium-noir'],
  ['Intense Aibek Fragrances',         'fragrances/perfume-50ml/intense-aibek'],
  ['Laichu Signature Fragrances',      'fragrances/perfume-50ml/laichu-signature'],
  ['Minuit Noir Fragrances',           'fragrances/perfume-50ml/minuit-noir'],
  ['Monarach Oud Fragrances',          'fragrances/perfume-50ml/monarach-oud'],
  ['Noir Lehan Fragrances',            'fragrances/perfume-50ml/noir-lehan'],
  ['Obsidien Fragrances',              'fragrances/perfume-50ml/obsidien'],
  ['Oud Prive Fragrances',             'fragrances/perfume-50ml/oud-prive'],
  ['Safran Intense Fragrances',        'fragrances/perfume-50ml/safran-intense'],
];

// ── Fetch all resources from Cloudinary under enjoyful/products/ ──────────────
async function fetchAllCloudinaryResources() {
  const allResources = [];
  let nextCursor = null;

  console.log('☁️  Fetching resources from Cloudinary...');
  do {
    const options = {
      type:          'upload',
      prefix:        'enjoyful/products/',
      max_results:   500,
      resource_type: 'image',
    };
    if (nextCursor) options.next_cursor = nextCursor;

    const result = await cloudinary.api.resources(options);
    allResources.push(...result.resources);
    nextCursor = result.next_cursor || null;
    process.stdout.write(`\r   Fetched ${allResources.length} images so far...`);
  } while (nextCursor);

  process.stdout.write('\n');
  console.log(`   Total: ${allResources.length} images in Cloudinary\n`);
  return allResources;
}

// Group resources by their folder path (everything before the last /)
function groupByFolder(resources) {
  const map = {};
  for (const res of resources) {
    const folder = res.public_id.split('/').slice(0, -1).join('/');
    if (!map[folder]) map[folder] = [];
    map[folder].push(res);
  }
  return map;
}

// Sort: thumbnail (public_id ends in "21") first, then others alphabetically
function sortResources(resources) {
  return [...resources].sort((a, b) => {
    const aId = a.public_id.split('/').pop();
    const bId = b.public_id.split('/').pop();
    const aThumb = /21$/.test(aId);
    const bThumb = /21$/.test(bId);
    if (aThumb && !bThumb) return -1;
    if (!aThumb && bThumb) return 1;
    return aId.localeCompare(bId);
  });
}

// Find exact folder for a product by name
function getFolderForProduct(productName) {
  const n = productName.toLowerCase().replace('enjoyful life ', '');
  for (const [fragment, folder] of PRODUCT_FOLDER_MAP) {
    if (n.includes(fragment.toLowerCase())) {
      return `enjoyful/products/${folder}`;
    }
  }
  return null;
}

// Build optimised Cloudinary URL with transforms
function buildUrl(publicId) {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'dk9mwcx68'}/image/upload/f_auto,q_auto/${publicId}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // Step 1: Fetch all images from Cloudinary
  const resources   = await fetchAllCloudinaryResources();
  const folderIndex = groupByFolder(resources);

  console.log(`📂 Found ${Object.keys(folderIndex).length} folders in Cloudinary:`);
  for (const [folder, items] of Object.entries(folderIndex)) {
    console.log(`   ${folder.replace('enjoyful/products/', '')} — ${items.length} image(s)`);
  }
  console.log('');

  // Step 2: Clear all image fields from every product
  console.log('🗑️  Clearing all image fields from MongoDB products...');
  const clearResult = await ProductModel.updateMany(
    {},
    { $set: { image: '', hoverImage: '', images: [] } }
  );
  console.log(`   Cleared ${clearResult.modifiedCount} products\n`);

  // Step 3: Match products to Cloudinary folders and save
  console.log('🔗 Matching products to Cloudinary folders...\n');
  const products = await ProductModel.find({}).lean();

  let matched = 0, noImages = 0;

  for (const product of products) {
    const folder = getFolderForProduct(product.name);

    if (!folder) {
      process.stdout.write(`  ⚪ No mapping:  ${product.name.slice(0, 70)}\n`);
      noImages++;
      continue;
    }

    const folderResources = folderIndex[folder];

    if (!folderResources || folderResources.length === 0) {
      process.stdout.write(`  ⚠️  Empty folder: ${folder.replace('enjoyful/products/', '')}\n`);
      noImages++;
      continue;
    }

    const sorted = sortResources(folderResources);
    const images = sorted.map((res, i) => ({
      url:       buildUrl(res.public_id),
      publicId:  res.public_id,
      alt:       product.name,
      isPrimary: i === 0,
    }));

    await ProductModel.findByIdAndUpdate(product._id, {
      $set: {
        image:      images[0].url,
        hoverImage: images[1]?.url ?? images[0].url,
        images,
      },
    });

    process.stdout.write(
      `  ✅ ${product.name.slice(0, 55).padEnd(55)} ${String(images.length).padStart(2)} img  [${folder.replace('enjoyful/products/', '')}]\n`
    );
    matched++;
  }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`✅ Products with images:    ${matched}`);
  console.log(`⚪ Products without images: ${noImages} (show placeholder until images are shot)`);
  console.log('\n✅ All done — images rebuilt directly from Cloudinary.');
  await mongoose.disconnect();
}

main().catch(err => { console.error('\n❌ Fatal:', err.message); process.exit(1); });
