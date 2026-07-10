/**
 * READ-ONLY: confirm the Cloudinary `enjoyful/products/` prefix is safe to delete —
 * i.e. NO non-product document (slides/banners/settings) references an image under it,
 * and product images are NOT reused as carousel/banners.
 */
'use strict';
require('dotenv/config');
const mongoose = require('mongoose');

function urlsIn(obj, acc = []) {
  if (obj == null) return acc;
  if (typeof obj === 'string') { if (/res\.cloudinary\.com/.test(obj) || /^enjoyful\//.test(obj)) acc.push(obj); return acc; }
  if (Array.isArray(obj)) { obj.forEach(o => urlsIn(o, acc)); return acc; }
  if (typeof obj === 'object') { for (const k of Object.keys(obj)) urlsIn(obj[k], acc); }
  return acc;
}
const folderOf = u => {
  const m = u.match(/upload\/(?:[^/]+\/)*?(enjoyful\/[^/]+)\//) || u.match(/(enjoyful\/[^/]+)\//);
  return m ? m[1] : (u.startsWith('enjoyful/') ? 'enjoyful/' + u.split('/')[1] : '(other)');
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collections = ['slides', 'categorybanners', 'banners', 'settings', 'products'];
  const summary = {};
  for (const name of collections) {
    const docs = await db.collection(name).find({}).toArray();
    const folders = {};
    for (const d of docs) for (const u of urlsIn(d)) { const f = folderOf(u); folders[f] = (folders[f] || 0) + 1; }
    summary[name] = folders;
  }
  console.log('=== Cloudinary folder references BY collection ===');
  for (const [name, folders] of Object.entries(summary)) {
    console.log(`\n${name}:`);
    if (!Object.keys(folders).length) console.log('   (no image refs)');
    for (const [f, c] of Object.entries(folders)) console.log(`   ${f}: ${c}`);
  }
  // The key safety check:
  const nonProduct = ['slides', 'categorybanners', 'banners', 'settings'];
  let danger = false;
  for (const n of nonProduct) for (const f of Object.keys(summary[n])) if (f === 'enjoyful/products') { danger = true; console.log(`\n⚠ ${n} references enjoyful/products — NOT safe to blanket-delete!`); }
  console.log('\n' + (danger ? '⛔ Product folder is REFERENCED by non-product docs.' : '✅ SAFE: no carousel/banner/settings doc references enjoyful/products/. Deleting that prefix only affects products.'));
  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
