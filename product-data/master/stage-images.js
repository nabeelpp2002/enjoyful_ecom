'use strict';
/**
 * Build the CLEAN local image library from matched source files:
 *   product-data/product-images-clean/{category}/{subcategory}/{slug}[.webp | -2.webp ...]
 * Web-sized WebP (longest side <=1400, q82). Non-destructive (originals untouched).
 *   node product-data/master/stage-images.js
 * Writes staged-manifest.json = [{ slug, publicIdBase, files:[{local, publicId}] }]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('/home/nibras-s/Desktop/Projects/enjoyful_ecom/enjoyful-api/node_modules/sharp');
const ROOT = '/home/nibras-s/Desktop/Projects/enjoyful_ecom/product-data';
const OUTDIR = path.join(ROOT, 'product-images-clean');
const manifest = require(path.join(ROOT, 'master', 'image-manifest.json'));

async function process(src, destAbs) {
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  await sharp(src, { failOn: 'none' })
    .rotate()
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destAbs);
  return fs.statSync(destAbs).size;
}

(async () => {
  // wipe previous clean output for a deterministic rebuild
  fs.rmSync(OUTDIR, { recursive: true, force: true });
  const staged = [];
  let count = 0, bytes = 0;
  for (const m of manifest) {
    if (!m.primary) continue;
    const files = [];
    const sources = [m.primary, ...(m.alternates || [])].slice(0, 4);
    for (let i = 0; i < sources.length; i++) {
      const suffix = i === 0 ? '' : `-${i + 1}`;
      const rel = `${m.folder}/${m.slug}${suffix}.webp`;
      const destAbs = path.join(OUTDIR, rel);
      try {
        bytes += await process(sources[i], destAbs);
        count++;
        files.push({ local: destAbs, publicId: `${m.publicId}${suffix}` });
      } catch (e) {
        console.log(`  ! failed ${m.slug}${suffix}: ${e.message}`);
      }
    }
    staged.push({ slug: m.slug, publicIdBase: m.publicId, files });
  }
  fs.writeFileSync(path.join(ROOT, 'master', 'staged-manifest.json'), JSON.stringify(staged, null, 2));
  console.log(`Staged ${count} images for ${staged.length} SKUs → ${OUTDIR}`);
  console.log(`Total clean library size: ${(bytes / 1048576).toFixed(1)} MB`);
  console.log(`Avg image size: ${(bytes / count / 1024).toFixed(0)} KB`);
})().catch(e => { console.error(e); process.exit(1); });
