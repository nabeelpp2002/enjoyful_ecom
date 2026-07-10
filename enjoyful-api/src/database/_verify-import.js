'use strict';
require('dotenv/config');
const mongoose = require('mongoose');
const https = require('https');

function head(url) {
  return new Promise(res => {
    https.get(url, r => { r.resume(); res(r.statusCode); }).on('error', () => res(0));
  });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const P = db.collection('products'), C = db.collection('categories');

  console.log('=== CATEGORIES ===');
  const cats = await C.find({}).sort({ sortOrder: 1 }).toArray();
  for (const c of cats) console.log(`  ${c.name} (${c.slug})`);
  const catById = Object.fromEntries(cats.map(c => [String(c._id), c.name]));

  console.log('\n=== PRODUCTS ===');
  const total = await P.countDocuments();
  const visible = await P.countDocuments({ isHidden: { $ne: true } });
  const hidden = await P.countDocuments({ isHidden: true });
  const withImg = await P.countDocuments({ image: { $nin: [null, ''] } });
  console.log(`  total=${total}  visible=${visible}  hidden=${hidden}  withImage=${withImg}`);

  console.log('\n=== BY CATEGORY (visible only) ===');
  const byCat = await P.aggregate([
    { $match: { isHidden: { $ne: true } } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ]).toArray();
  for (const r of byCat) console.log(`  ${catById[String(r._id)] || r._id}: ${r.n}`);

  console.log('\n=== VARIANT FAMILIES (multi-size) ===');
  const fams = await P.aggregate([
    { $match: { productFamily: { $nin: [null, ''] } } },
    { $group: { _id: '$productFamily', n: { $sum: 1 }, sizes: { $push: '$size' } } },
    { $match: { n: { $gt: 1 } } }, { $sort: { _id: 1 } },
  ]).toArray();
  console.log(`  ${fams.length} families with 2+ sizes`);
  fams.slice(0, 6).forEach(f => console.log(`   - ${f._id}: ${f.sizes.join(', ')}`));

  console.log('\n=== DATA INTEGRITY ===');
  const noCat = await P.countDocuments({ category: null });
  const noSlug = await P.countDocuments({ slug: { $in: [null, ''] } });
  const dupSlugs = await P.aggregate([{ $group: { _id: '$slug', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray();
  console.log(`  products w/o category: ${noCat}`);
  console.log(`  products w/o slug: ${noSlug}`);
  console.log(`  duplicate slugs: ${dupSlugs.length}`);
  console.log(`  Home Care priced: ${await P.countDocuments({ subcategory: { $exists: true }, price: { $gt: 0 } })} products with price>0`);

  console.log('\n=== NEW SUBCATEGORIES present ===');
  console.log(`  Body Scrub: ${await P.countDocuments({ subcategory: 'Body Scrub' })}`);
  console.log(`  Hair Removal: ${await P.countDocuments({ subcategory: 'Hair Removal' })}`);

  console.log('\n=== IMAGE URL reachability (5 samples) ===');
  const samples = await P.find({ image: { $nin: [null, ''] } }).limit(5).toArray();
  for (const s of samples) { const code = await head(s.image); console.log(`  [${code}] ${s.name} ${s.size} -> ${s.image.slice(0, 80)}`); }

  console.log('\n=== HIDDEN (imageless) products — should appear in Admin Missing Images ===');
  const hid = await P.find({ isHidden: true }).project({ name: 1, size: 1 }).toArray();
  console.log('  ' + hid.map(h => h.name + (h.size ? ' ' + h.size : '')).join(' · '));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
