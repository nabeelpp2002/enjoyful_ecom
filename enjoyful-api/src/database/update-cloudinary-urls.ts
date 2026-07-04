/**
 * Patches MongoDB product records with new Cloudinary WebP URLs
 * after running product-data/cloudinary-upload.ts
 *
 * Usage:
 *   $env:MONGODB_URI = "mongodb+srv://..."
 *   npx ts-node -r tsconfig-paths/register src/database/update-cloudinary-urls.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';

const URL_MAP_PATH = path.join(__dirname, '..', '..', '..', 'product-data', 'cloudinary-urls.json');

const ProductSchema = new mongoose.Schema({
  name: String,
  image: String,
  hoverImage: String,
  images: [{ url: String, publicId: String, alt: String, isPrimary: Boolean }],
}, { strict: false });

// ── Family slug patches — set productFamily on existing products ─────────────

const FAMILY_PATCHES: Array<{ nameContains: string; productFamily: string }> = [
  { nameContains: 'Almond Body Lotion',            productFamily: 'almond-body-lotion' },
  { nameContains: 'Aloevera Body Lotion',           productFamily: 'aloevera-body-lotion' },
  { nameContains: 'Mix Fruit Body Lotion',          productFamily: 'mix-fruit-body-lotion' },
  { nameContains: 'Coffee Face Scrub',              productFamily: 'coffee-face-scrub' },
  { nameContains: 'Walnut Apricot Face Scrub',      productFamily: 'walnut-apricot-face-scrub' },
  { nameContains: 'Walnut Face Scrub',              productFamily: 'walnut-face-scrub' },
  { nameContains: 'Apricot Face Scrub',             productFamily: 'apricot-face-scrub' },
  { nameContains: 'Peel Off Mask',                  productFamily: 'peel-off-mask' },
  { nameContains: 'Sunscreen Cream',                productFamily: 'sunscreen-cream' },
  { nameContains: 'Aloevera Gel',                   productFamily: 'aloevera-gel' },
  { nameContains: 'Rose Water',                     productFamily: 'rose-water-premium' },
  { nameContains: 'Vit C Lemon Face Wash',          productFamily: 'lemon-face-wash' },
  { nameContains: 'Vit C Orange Face Wash',         productFamily: 'orange-face-wash' },
  { nameContains: 'Vit C Papaya Face Wash',         productFamily: 'papaya-face-wash' },
  { nameContains: 'Aloe Calm Shampoo',              productFamily: 'aloe-calm-shampoo' },
  { nameContains: 'Bamboo Balance Shampoo',         productFamily: 'bamboo-balance-shampoo' },
  { nameContains: 'Botanical Deep Clean Shampoo',   productFamily: 'botanical-shampoo' },
  { nameContains: 'Onion Shampoo',                  productFamily: 'onion-shampoo' },
  { nameContains: 'Jasmin Oil',                     productFamily: 'jasmin-oil' },
  { nameContains: 'Baby Lotion',                    productFamily: 'baby-lotion' },
  { nameContains: 'Baby Wash',                      productFamily: 'baby-wash' },
  { nameContains: 'Baby Talc',                      productFamily: 'baby-talc' },
  { nameContains: 'Baby Rash Cream',                productFamily: 'baby-rash-cream' },
  { nameContains: 'Aloevera Hair Removal Cream',    productFamily: 'aloevera-hair-removal-cream' },
  { nameContains: 'Amber Glow Body Mist',           productFamily: 'amber-glow-body-mist' },
  { nameContains: 'Blossom Veil Body Mist',         productFamily: 'blossom-veil-body-mist' },
  { nameContains: 'Coastal Pulse Body Mist',        productFamily: 'coastal-pulse-body-mist' },
  { nameContains: 'Midnight Velvet Body Mist',      productFamily: 'midnight-velvet-body-mist' },
  { nameContains: 'Noir Element Body Mist',         productFamily: 'noir-element-body-mist' },
  { nameContains: 'Vanilla Aura Body Mist',         productFamily: 'vanilla-aura-body-mist' },
];

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ Connected');

  const ProductModel = mongoose.model('Product', ProductSchema);

  // ── 1. Patch productFamily on all matching products ──────────────────────
  console.log('\n📦 Setting productFamily on product variants...');
  let familyPatched = 0;
  for (const patch of FAMILY_PATCHES) {
    const result = await ProductModel.updateMany(
      { name: { $regex: patch.nameContains, $options: 'i' } },
      { $set: { productFamily: patch.productFamily } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  ✅ ${patch.nameContains}: ${result.modifiedCount} products → family "${patch.productFamily}"`);
      familyPatched += result.modifiedCount;
    }
  }
  console.log(`   ${familyPatched} products updated with productFamily`);

  // ── 2. Patch image URLs from cloudinary-urls.json ─────────────────────────
  if (!fs.existsSync(URL_MAP_PATH)) {
    console.log('\n⚠️  cloudinary-urls.json not found — skipping URL update.');
    console.log('   Run product-data/cloudinary-upload.ts first to generate it.');
    await mongoose.disconnect();
    return;
  }

  const urlMap: Record<string, string> = JSON.parse(fs.readFileSync(URL_MAP_PATH, 'utf8'));
  console.log(`\n🖼  Loaded ${Object.keys(urlMap).length} URL mappings`);

  // Build a reverse map: product name keyword → primary + hover + gallery urls
  // This is a simplified approach — for production, build a proper name→urls lookup

  const products = await ProductModel.find({}).lean() as Array<{
    _id: unknown; name: string; image: string; hoverImage: string;
    images: Array<{ url: string; publicId: string; alt: string; isPrimary: boolean }>;
  }>;

  console.log(`   Scanning ${products.length} products for URL matches...`);
  let urlPatched = 0;

  for (const product of products) {
    const matchingUrls = Object.entries(urlMap)
      .filter(([localPath]) => {
        // Match by folder name to product name heuristic
        const folderParts = localPath.toLowerCase().split('/');
        const productNameLower = product.name.toLowerCase()
          .replace('enjoyful life ', '').replace(/\s*\(\d+\)\s*/g, '').trim();
        return folderParts.some(part => productNameLower.includes(part) || part.includes(productNameLower.split(' ')[0]));
      })
      .map(([, url]) => url)
      .filter((url, i, arr) => arr.indexOf(url) === i); // dedupe

    if (matchingUrls.length === 0) continue;

    // Sort: thumbnail (21) first, then rest
    const sorted = matchingUrls.sort((a, b) => {
      const aIs21 = a.includes('21');
      const bIs21 = b.includes('21');
      if (aIs21 && !bIs21) return -1;
      if (!aIs21 && bIs21) return 1;
      return 0;
    });

    const [primary, hover, ...gallery] = sorted;
    const images = sorted.map((url, i) => ({
      url,
      publicId: '',
      alt: product.name,
      isPrimary: i === 0,
    }));

    await ProductModel.findByIdAndUpdate(product._id, {
      $set: {
        image: primary,
        hoverImage: hover ?? primary,
        images,
      },
    });
    urlPatched++;
  }

  console.log(`   ✅ ${urlPatched} products updated with Cloudinary URLs`);

  console.log('\n🎉 Done!');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
