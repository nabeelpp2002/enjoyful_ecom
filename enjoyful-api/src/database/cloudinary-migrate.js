/**
 * DESTRUCTIVE (Cloudinary only): delete all product images under enjoyful/products/,
 * then fresh-upload the clean staged library with deterministic slug-based public IDs.
 * Carousel + category banners are NOT touched.
 * Writes product-data/master/image-urls.json  (slug -> {image, images[]}).
 *   node src/database/cloudinary-migrate.js
 */
'use strict';
require('dotenv/config');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MASTER = path.resolve(__dirname, '..', '..', '..', 'product-data', 'master');
const staged = require(path.join(MASTER, 'staged-manifest.json'));

async function pool(items, size, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: size }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  console.log('Cloud:', process.env.CLOUDINARY_CLOUD_NAME);

  // ── 1. DELETE all product images (prefix) ──
  console.log('\n[1/3] Deleting enjoyful/products/ …');
  let totalDeleted = 0, guard = 0;
  do {
    const res = await cloudinary.api.delete_resources_by_prefix('enjoyful/products/');
    const n = Object.keys(res.deleted || {}).length;
    totalDeleted += n;
    if (n === 0 || ++guard > 10) break;
  } while (true);
  console.log(`   deleted ~${totalDeleted} resources`);
  try { await cloudinary.api.delete_folder('enjoyful/products'); } catch (e) { /* folder may still nest */ }

  // ── 2. UPLOAD staged images ──
  const jobs = [];
  for (const s of staged) for (let k = 0; k < s.files.length; k++) jobs.push({ slug: s.slug, isPrimary: k === 0, ...s.files[k] });
  console.log(`\n[2/3] Uploading ${jobs.length} clean images …`);
  let done = 0, failed = 0;
  const results = await pool(jobs, 8, async (job) => {
    if (!fs.existsSync(job.local)) { failed++; return null; }
    try {
      const r = await cloudinary.uploader.upload(job.local, {
        public_id: job.publicId, overwrite: true, resource_type: 'image', invalidate: true,
      });
      done++;
      if (done % 40 === 0) console.log(`   …${done}/${jobs.length}`);
      return { slug: job.slug, isPrimary: job.isPrimary, url: r.secure_url, publicId: r.public_id };
    } catch (e) { failed++; console.log(`   ! ${job.publicId}: ${e.message}`); return null; }
  });
  console.log(`   uploaded ${done}, failed ${failed}`);

  // ── 3. Build slug -> {image, images[]} ──
  const bySlug = {};
  for (const r of results.filter(Boolean)) {
    (bySlug[r.slug] = bySlug[r.slug] || { image: '', images: [] });
    bySlug[r.slug].images.push({ url: r.url, publicId: r.publicId, isPrimary: r.isPrimary });
  }
  for (const slug of Object.keys(bySlug)) {
    const imgs = bySlug[slug].images.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    bySlug[slug].image = (imgs.find(i => i.isPrimary) || imgs[0]).url;
    bySlug[slug].images = imgs;
  }
  fs.writeFileSync(path.join(MASTER, 'image-urls.json'), JSON.stringify(bySlug, null, 2));
  console.log(`\n[3/3] Wrote image-urls.json for ${Object.keys(bySlug).length} SKUs.`);
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
