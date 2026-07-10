/**
 * READ-ONLY inspection of live MongoDB + Cloudinary state.
 * Does NOT modify anything. Run from enjoyful-api/:
 *   node src/database/_inspect-state.js
 */
'use strict';
require('dotenv/config');
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }
  // mask the uri host only
  const masked = uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@');
  console.log('Mongo URI (masked):', masked);
  await mongoose.connect(uri);
  console.log('Connected.\n');

  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  console.log('=== COLLECTIONS ===');
  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count} docs`);
  }

  // Categories
  console.log('\n=== CATEGORIES ===');
  const categories = await db.collection('categories').find({}).toArray();
  for (const cat of categories) {
    console.log(`  ${cat.name} (slug=${cat.slug}) _id=${cat._id}`);
  }

  // Products summary
  console.log('\n=== PRODUCTS SUMMARY ===');
  const prodCol = db.collection('products');
  const total = await prodCol.countDocuments();
  console.log('  total products:', total);
  if (total > 0) {
    const withImages = await prodCol.countDocuments({ 'images.0': { $exists: true } });
    const withImageStr = await prodCol.countDocuments({ image: { $nin: [null, ''] } });
    const hidden = await prodCol.countDocuments({ isHidden: true });
    const active = await prodCol.countDocuments({ isActive: true });
    console.log('  with images[]:', withImages);
    console.log('  with image (string):', withImageStr);
    console.log('  isHidden:true:', hidden);
    console.log('  isActive:true:', active);

    // group by category
    const byCat = await prodCol.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]).toArray();
    console.log('  by category id:', JSON.stringify(byCat));

    // sample 5 image urls to identify cloudinary account
    const samples = await prodCol.find({}, { projection: { name: 1, image: 1, 'images.url': 1, productFamily: 1 } }).limit(8).toArray();
    console.log('\n=== SAMPLE PRODUCTS (image urls) ===');
    for (const p of samples) {
      const firstImg = (p.images && p.images[0] && p.images[0].url) || p.image || '(none)';
      console.log(`  - ${p.name} | family=${p.productFamily || '-'} | img=${firstImg}`);
    }

    // distinct cloudinary cloud names referenced in image urls
    const allImgs = await prodCol.find({}, { projection: { image: 1, 'images.url': 1 } }).toArray();
    const clouds = new Set();
    const hosts = new Set();
    for (const p of allImgs) {
      const urls = [];
      if (p.image) urls.push(p.image);
      if (p.images) for (const im of p.images) if (im.url) urls.push(im.url);
      for (const u of urls) {
        const m = u.match(/res\.cloudinary\.com\/([^/]+)\//);
        if (m) clouds.add(m[1]);
        try { hosts.add(new URL(u).host); } catch {}
      }
    }
    console.log('\n  distinct cloudinary clouds referenced:', [...clouds]);
    console.log('  distinct image hosts referenced:', [...hosts]);
  }

  await mongoose.disconnect();
  console.log('\nDone (read-only).');
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
