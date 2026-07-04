/**
 * Enjoyful Life — WebP Conversion + Cloudinary Upload
 * Run from enjoyful-api/ directory:
 *   node src/database/upload-product-images.js
 *
 * Reads:  D:\N3 Projects\enjoyful\product-images\
 * Writes: product-data/cloudinary-urls.json
 */

'use strict';

const sharp = require('sharp');
const { v2: cloudinary } = require('cloudinary');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ── Credentials (read from .env or process.env) ──────────────────────────────
require('dotenv/config');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dk9mwcx68',
  api_key:    process.env.CLOUDINARY_API_KEY    || '152899332391665',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'wjm6TG1iLqMBBlznvAsqIFS12Wo',
  secure:     true,
});

const IMAGES_ROOT  = path.resolve(__dirname, '..', '..', '..', '..', 'product-images');
const OUTPUT_JSON  = path.resolve(__dirname, '..', '..', '..', 'product-data', 'cloudinary-urls.json');
const TMP_DIR      = path.join(os.tmpdir(), 'enjoyful-webp');
const CONCURRENCY  = 5;

// ── Folder map: relative path prefix (lowercase) → Cloudinary folder ─────────
const FOLDER_MAP = [
  // GLOW — Face Wash
  ['face wash/lemon face wash/150ml',   'enjoyful/products/glow/face-wash/lemon-vit-c'],
  ['face wash/lemon face wash/60ml',    'enjoyful/products/glow/face-wash/lemon-vit-c'],
  ['face wash/orange',                  'enjoyful/products/glow/face-wash/orange-vit-c'],
  ['face wash/papaya',                  'enjoyful/products/glow/face-wash/papaya-vit-c'],
  ['face wash/charcoal face wash',      'enjoyful/products/glow/face-wash/charcoal'],
  // GLOW — Face Scrub
  ['face scrub/coffee scrub/150ml mockup', 'enjoyful/products/glow/face-scrub/coffee'],
  ['face scrub/coffee scrub/50ml',         'enjoyful/products/glow/face-scrub/coffee'],
  ['face scrub/walnut/mockup 50ml',        'enjoyful/products/glow/face-scrub/walnut'],
  ['face scrub/apricot/enjoyfullife_apricot face scrub 150ml/website', 'enjoyful/products/glow/face-scrub/apricot'],
  ['face scrub/apricot/enjoyfullife_apricot face scrub 50ml',          'enjoyful/products/glow/face-scrub/apricot'],
  ['face scrub/enjoyful_walnut apricot/150ml',      'enjoyful/products/glow/face-scrub/walnut-apricot'],
  ['face scrub/enjoyful_walnut apricot/50ml mockup','enjoyful/products/glow/face-scrub/walnut-apricot'],
  // GLOW — Mask / Sunscreen / Gel
  ['peel off mask',          'enjoyful/products/glow/face-mask/peel-off'],
  ['sunscreen/mockup/50ml',  'enjoyful/products/glow/sunscreen'],
  ['sunscreen/mockup/150ml', 'enjoyful/products/glow/sunscreen'],
  ['aloe vera gel',          'enjoyful/products/glow/aloe-vera-gel'],
  // DAILY — Body Lotion
  ['almond lotion',           'enjoyful/products/daily/body-lotion/almond'],
  ['aloe vera lotion',        'enjoyful/products/daily/body-lotion/aloevera'],
  ['mix fruit lotion',        'enjoyful/products/daily/body-lotion/mix-fruit'],
  ['moisture balance lotion', 'enjoyful/products/daily/body-lotion/moisture-balance'],
  // DAILY — Body Cream
  ['almond moisturising cream',    'enjoyful/products/daily/body-cream/almond'],
  ['mix fruit moisturing cream',   'enjoyful/products/daily/body-cream/mix-fruit'],
  ['daily delight',                'enjoyful/products/daily/body-cream/daily-delight'],
  // DAILY — Shower Gel
  ['shower gel/morning buzz',  'enjoyful/products/daily/shower-gel/morning-buzz'],
  ['shower gel/ice blast',     'enjoyful/products/daily/shower-gel/ice-blast'],
  ['shower gel/cglow',         'enjoyful/products/daily/shower-gel/c-glow'],
  ['shower gel/aloe bliss',    'enjoyful/products/daily/shower-gel/aloe-bliss'],
  // DAILY — Shampoo
  ['shampoo/aloe calm',       'enjoyful/products/daily/shampoo/aloe-calm'],
  ['shampoo/bamboo balance',  'enjoyful/products/daily/shampoo/bamboo-balance'],
  ['shampoo/botanical shampoo', 'enjoyful/products/daily/shampoo/botanical-deep-clean'],
  ['shampoo/onion',           'enjoyful/products/daily/shampoo/onion'],
  // DAILY — Other
  ['hair oil',              'enjoyful/products/daily/hair-oil/jasmin'],
  ['hair removal cream',    'enjoyful/products/daily/hair-removal-cream'],
  // BABY
  ['baby/baby lotion',             'enjoyful/products/baby/baby-lotion'],
  ['cleaning products/baby wash',  'enjoyful/products/baby/baby-wash'],
  ['baby/baby powder',             'enjoyful/products/baby/baby-talc'],
  ['baby/baby rash cream',         'enjoyful/products/baby/baby-rash-cream'],
  ['baby/baby soap',               'enjoyful/products/baby/baby-soap'],
  // FRAGRANCES — Perfume 100ml
  ['perfume/100ml/amber imperial',  'enjoyful/products/fragrances/perfume-100ml/amber-imperial'],
  ['perfume/100ml/amber ophir',     'enjoyful/products/fragrances/perfume-100ml/amber-ophir'],
  ['perfume/100ml/atlas oud',       'enjoyful/products/fragrances/perfume-100ml/atlas-oud'],
  ['perfume/100ml/jasmine nomade',  'enjoyful/products/fragrances/perfume-100ml/jasmine-nomade'],
  ['perfume/100ml/noir velours',    'enjoyful/products/fragrances/perfume-100ml/noir-velours'],
  ["perfume/100ml/petal d'amichu",  'enjoyful/products/fragrances/perfume-100ml/petal-damichu'],
  ['perfume/100ml/reine florale',   'enjoyful/products/fragrances/perfume-100ml/reine-florale'],
  ['perfume/100ml/royal eclat',     'enjoyful/products/fragrances/perfume-100ml/royal-eclat'],
  ['perfume/100ml/royal safran',    'enjoyful/products/fragrances/perfume-100ml/royal-safran'],
  ['perfume/100ml/zoya flora',      'enjoyful/products/fragrances/perfume-100ml/zoya-flora'],
  // FRAGRANCES — Perfume 50ml
  ['perfume/50ml/cuir imperial',    'enjoyful/products/fragrances/perfume-50ml/cuir-imperial'],
  ['perfume/50ml/ebène noir',       'enjoyful/products/fragrances/perfume-50ml/ebene-noir'],
  ['perfume/50ml/ebene noir',       'enjoyful/products/fragrances/perfume-50ml/ebene-noir'],
  ['perfume/50ml/gold victorie',    'enjoyful/products/fragrances/perfume-50ml/gold-victorie'],
  ['perfume/50ml/imperium noir',    'enjoyful/products/fragrances/perfume-50ml/imperium-noir'],
  ['perfume/50ml/intense aibek',    'enjoyful/products/fragrances/perfume-50ml/intense-aibek'],
  ['perfume/50ml/laichu signature', 'enjoyful/products/fragrances/perfume-50ml/laichu-signature'],
  ['perfume/50ml/minuit noir',      'enjoyful/products/fragrances/perfume-50ml/minuit-noir'],
  ['perfume/50ml/monarach oud',     'enjoyful/products/fragrances/perfume-50ml/monarach-oud'],
  ['perfume/50ml/noir lehan',       'enjoyful/products/fragrances/perfume-50ml/noir-lehan'],
  ['perfume/50ml/obsidien',         'enjoyful/products/fragrances/perfume-50ml/obsidien'],
  ['perfume/50ml/oud prive',        'enjoyful/products/fragrances/perfume-50ml/oud-prive'],
  ['perfume/50ml/safran intense',   'enjoyful/products/fragrances/perfume-50ml/safran-intense'],
  // FRAGRANCES — Body Mist
  ['body mist/amber glow',      'enjoyful/products/fragrances/body-mist/amber-glow'],
  ['body mist/blossom veil',    'enjoyful/products/fragrances/body-mist/blossom-veil'],
  ['body mist/coastal pulse',   'enjoyful/products/fragrances/body-mist/coastal-pulse'],
  ['body mist/midnight velvet', 'enjoyful/products/fragrances/body-mist/midnight-velvet'],
  ['body mist/noir element',    'enjoyful/products/fragrances/body-mist/noir-element'],
  ['body mist/vanilla aura',    'enjoyful/products/fragrances/body-mist/vanilla-aura'],
  // FRAGRANCES — Roll On / Deo
  ['roll on/apex 72',       'enjoyful/products/fragrances/roll-on/apex-72h'],
  ['roll on/element zero',  'enjoyful/products/fragrances/roll-on/element-zero'],
  ['roll on/lumi glow',     'enjoyful/products/fragrances/roll-on/lumi-glow'],
  ['roll on/noir oud',      'enjoyful/products/fragrances/roll-on/noir-oud'],
  ['roll on/pure renewal',  'enjoyful/products/fragrances/roll-on/pure-renewal'],
  ['roll on/velvet repair', 'enjoyful/products/fragrances/roll-on/velvet-repair'],
];

function resolveCloudFolder(absolutePath) {
  const rel = path.relative(IMAGES_ROOT, absolutePath).replace(/\\/g, '/').toLowerCase();
  for (const [match, folder] of FOLDER_MAP) {
    if (rel.startsWith(match)) return folder;
  }
  return null;
}

function makePublicId(filename, cloudFolder) {
  const base = path.basename(filename, path.extname(filename))
    .replace(/[^\w\s-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cloudFolder}/${base}`;
}

const SKIP_EXT = new Set(['.ds_store', '']);
function walkSync(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkSync(full));
    else {
      const ext = path.extname(e.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) out.push(full);
    }
  }
  return out;
}

async function toWebp(src) {
  const base = path.basename(src, path.extname(src));
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  // Unique tmp name to avoid clashes across folders with same filename
  const safeName = base.replace(/[^\w-]/g, '_');
  const dest = path.join(TMP_DIR, `${safeName}_${Date.now()}.webp`);
  await sharp(src).webp({ quality: 82, effort: 4 }).toFile(dest);
  return dest;
}

async function processChunk(chunk, urlMap, counters) {
  await Promise.all(chunk.map(async ({ src, cloudFolder }) => {
    const filename = path.basename(src);
    const publicId = makePublicId(filename, cloudFolder);
    let webpPath = null;
    try {
      webpPath = await toWebp(src);
      const result = await cloudinary.uploader.upload(webpPath, {
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        format: 'webp',
      });
      urlMap[path.relative(IMAGES_ROOT, src).replace(/\\/g, '/')] = result.secure_url;
      counters.done++;
    } catch (err) {
      counters.errors.push({ file: path.relative(IMAGES_ROOT, src), error: err.message });
    } finally {
      if (webpPath && fs.existsSync(webpPath)) {
        try { fs.unlinkSync(webpPath); } catch {}
      }
    }
    process.stdout.write(`\r  [${counters.done + counters.errors.length}/${counters.total}] done=${counters.done} err=${counters.errors.length}   `);
  }));
}

async function main() {
  console.log('📂 Image root:', IMAGES_ROOT);
  if (!fs.existsSync(IMAGES_ROOT)) {
    console.error('❌ Image root not found:', IMAGES_ROOT); process.exit(1);
  }

  const allFiles = walkSync(IMAGES_ROOT);
  console.log(`   Found ${allFiles.length} image files`);

  const queue = [];
  const noMap = [];
  for (const f of allFiles) {
    const cf = resolveCloudFolder(f);
    if (cf) queue.push({ src: f, cloudFolder: cf });
    else noMap.push(path.relative(IMAGES_ROOT, f));
  }

  if (noMap.length) {
    console.log(`\n⚠️  ${noMap.length} files with no folder mapping (skipped):`);
    noMap.forEach(f => console.log('   ' + f));
  }

  console.log(`\n🚀 Uploading ${queue.length} files to Cloudinary (concurrency ${CONCURRENCY})...`);

  const urlMap = {};
  const counters = { done: 0, total: queue.length, errors: [] };

  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    await processChunk(queue.slice(i, i + CONCURRENCY), urlMap, counters);
  }

  process.stdout.write('\n');

  // Persist output
  const outputDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(urlMap, null, 2), 'utf8');

  console.log(`\n✅ Uploaded: ${counters.done}`);
  if (counters.errors.length) {
    console.log(`❌ Errors:   ${counters.errors.length}`);
    counters.errors.slice(0, 20).forEach(e => console.log(`   ${e.file}: ${e.error}`));
  }
  console.log(`\n📄 URL map → ${OUTPUT_JSON}`);
  console.log('Next: node src/database/patch-mongodb-urls.js');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
