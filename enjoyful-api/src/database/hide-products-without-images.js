/**
 * Enjoyful Life — Hide Products Without Real Photos
 *
 * Sets isHidden=true on any product whose image is missing/empty/placeholder
 * AND whose images[] array is empty. Sets isHidden=false on products that DO
 * have a real image. Fully reversible from the admin products page.
 *
 * Idempotent — safe to re-run after new photos are added and
 * rebuild-images-from-cloudinary.js has assigned them.
 *
 * Run from enjoyful-api/:
 *   node src/database/hide-products-without-images.js
 */
'use strict';

require('dotenv/config');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const PLACEHOLDER = '/assets/placeholder.png';

const ProductSchema = new mongoose.Schema({
  name: String,
  image: String,
  hoverImage: String,
  images: [{ url: String, publicId: String, alt: String, isPrimary: Boolean }],
  isHidden: Boolean,
}, { strict: false });
const ProductModel = mongoose.model('Product', ProductSchema);

// A product has a real photo if its `image` is a non-empty, non-placeholder
// string OR its images[] array contains at least one entry with a url.
function hasRealImage(p) {
  const img = (p.image || '').trim();
  const imgOk = img && img !== PLACEHOLDER && !img.endsWith('/placeholder.png');
  const arrOk = Array.isArray(p.images) && p.images.some(i => i && i.url && i.url.trim());
  return Boolean(imgOk || arrOk);
}

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const products = await ProductModel.find({ deletedAt: null }).lean();
  console.log(`Scanning ${products.length} products...\n`);

  const hidden = [];
  const shown = [];

  for (const p of products) {
    const real = hasRealImage(p);
    const desiredHidden = !real;

    // Only write when the state needs to change (keeps the run quiet + fast)
    if (Boolean(p.isHidden) !== desiredHidden) {
      await ProductModel.findByIdAndUpdate(p._id, { $set: { isHidden: desiredHidden } });
    }

    if (desiredHidden) hidden.push(p.name);
    else shown.push(p.name);
  }

  console.log('🙈 HIDDEN (no real photo yet):');
  if (hidden.length === 0) console.log('   (none)');
  hidden.forEach(n => console.log(`   • ${n}`));

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🙈 Hidden:  ${hidden.length} products (no photo — un-hide in admin once shot)`);
  console.log(`👁  Visible: ${shown.length} products (have real photos)`);
  console.log('\n✅ Done. Re-run anytime after adding photos to un-hide automatically.');

  await mongoose.disconnect();
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
