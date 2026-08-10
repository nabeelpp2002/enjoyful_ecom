/**
 * Home Care Image Upload Script
 * 1. Maps local images to DB products by SKU/name
 * 2. Converts to WebP via sharp (compressed)
 * 3. Uploads to Cloudinary
 * 4. Updates MongoDB products with image URLs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const { v2: cloudinary } = require('cloudinary');
const mongoose = require('mongoose');

// ── Config ──
const MOCKUP_ROOT = path.resolve(__dirname, 'home care/Mockup');
const TMP_DIR = path.join(os.tmpdir(), 'enjoyful-homecare-webp');
const CONCURRENCY = 3;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MONGO_URI = process.env.MONGODB_URI;
for (const name of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[name]) throw new Error(`${name} must be set in the environment`);
}

// ── IMAGE → PRODUCT MAPPING (SKU-based) ──
// Each entry: { folderMatch (lowercase path fragment), skuCode, cloudFolder, productId }
const IMAGE_MAP = [
  // ABAYA WASH
  { match: 'abaya wash/abaya wash 3l/', sku: 'AB-3L', cloud: 'enjoyful/products/home-care/laundry/abaya-wash-3l', id: '6a47903df4aac7e262810f67' },
  { match: 'abaya wash/abaya wash 5l', sku: 'AB-5L', cloud: 'enjoyful/products/home-care/laundry/abaya-wash-5l', id: '6a47903bf4aac7e262810f66' },

  // CREAM CLEANING LIQUID → Lemon Cream Cleaner 750ml (images don't specify size; assigning to 750ml)
  { match: 'cream cleaning liquid/', sku: 'CC-LEM-750', cloud: 'enjoyful/products/home-care/floor-surface/cream-cleaner-lemon-750ml', id: '6a479026f4aac7e262810f4e' },

  // DISH WASH LIQUID
  { match: 'dish wash liquid/aloe mint 5l', sku: 'DW-ALM-5L', cloud: 'enjoyful/products/home-care/kitchen/dishwash-aloe-mint-5l', id: '6a479038f4aac7e262810f62' },
  { match: 'dish wash liquid/apple breeze 5l', sku: 'DW-APB-5L', cloud: 'enjoyful/products/home-care/kitchen/dishwash-apple-breeze-5l', id: '6a479039f4aac7e262810f63' },
  { match: 'dish wash liquid/lemon fresh 5l', sku: 'DW-LF-5L', cloud: 'enjoyful/products/home-care/kitchen/dishwash-lemon-fresh-5l', id: '6a47903af4aac7e262810f64' },
  { match: 'dish wash liquid/dish wash liquid 1l/', sku: 'DW-LF-1L', cloud: 'enjoyful/products/home-care/kitchen/dishwash-lemon-fresh-1l', id: '6a47903bf4aac7e262810f65' },

  // FABRIC SOFTENER
  { match: 'fabric softner /relaxing lavender/', sku: 'FS-LAV-3L', cloud: 'enjoyful/products/home-care/laundry/fabric-softener-lavender', id: '6a479036f4aac7e262810f60' },
  { match: 'fabric softner /soft floral/', sku: 'FS-FLR-3L', cloud: 'enjoyful/products/home-care/laundry/fabric-softener-floral', id: '6a479037f4aac7e262810f61' },

  // FLOOR CLEANER
  { match: 'floor cleaner/pine fragnance floor cleaner_3l/', sku: 'FL-3XPIN-3L', cloud: 'enjoyful/products/home-care/floor-surface/floor-cleaner-pine-3l', id: '6a479025f4aac7e262810f4d' },
  { match: 'floor cleaner/lavender floor cleaner 3l/', sku: 'FL-3XLAV-3L', cloud: 'enjoyful/products/home-care/floor-surface/floor-cleaner-lavender-3l', id: '6a479024f4aac7e262810f4c' },
  { match: 'floor cleaner/citrust blast 5l', sku: 'DW-3XCB-5L', cloud: 'enjoyful/products/home-care/floor-surface/floor-cleaner-citrus-5l', id: '6a479020f4aac7e262810f47' },

  // GLASS CLEANER
  { match: 'glass cleaner/', sku: 'GC-750', cloud: 'enjoyful/products/home-care/bathroom/glass-cleaner', id: '6a479029f4aac7e262810f52' },

  // HANDWASH
  { match: 'handwash/cherry blossam/500ml/', sku: 'HW-CHB-500', cloud: 'enjoyful/products/home-care/hand/cherry-blossom-500ml', id: '6a479034f4aac7e262810f5d' },
  { match: 'handwash/cherry blossam/1l/', sku: 'HW-CHB-1L', cloud: 'enjoyful/products/home-care/hand/cherry-blossom-1l', id: '6a479033f4aac7e262810f5c' },
  { match: 'handwash/rich musk/500ml/', sku: 'HW-MUSK-500', cloud: 'enjoyful/products/home-care/hand/rich-musk-500ml', id: '6a479035f4aac7e262810f5f' },
  { match: 'handwash/rich musk/1l/', sku: 'HW-MUSK-1L', cloud: 'enjoyful/products/home-care/hand/rich-musk-1l', id: '6a479035f4aac7e262810f5e' },
  { match: 'handwash/vanila scent/500ml/', sku: 'HW-VAN-500', cloud: 'enjoyful/products/home-care/hand/sweet-vanilla-500ml', id: '6a479032f4aac7e262810f5b' },
  { match: 'handwash/vanila scent/1l/', sku: 'HW-VAN-1L', cloud: 'enjoyful/products/home-care/hand/sweet-vanilla-1l', id: '6a479031f4aac7e262810f5a' },
  { match: 'handwash/5l/oud royale', sku: 'HW-OUD-5L', cloud: 'enjoyful/products/home-care/hand/oud-royale-5l', id: '6a47902ef4aac7e262810f57' },
  { match: 'handwash/5l/papaya', sku: 'HW-PAP-5L', cloud: 'enjoyful/products/home-care/hand/papaya-5l', id: '6a479030f4aac7e262810f59' },
  { match: 'handwash/5l/lavender', sku: 'HW-LAV-5L', cloud: 'enjoyful/products/home-care/hand/lavender-5l', id: '6a47902ff4aac7e262810f58' },
  { match: 'handwash/5l/mind fresh', sku: 'HW-MINT-5L', cloud: 'enjoyful/products/home-care/hand/mint-fresh-5l', id: '6a47902df4aac7e262810f56' },

  // LIQUID DETERGENT
  { match: 'liquid detergent/ultra freshness 2l', sku: 'LD-9X-2L', cloud: 'enjoyful/products/home-care/laundry/liquid-detergent-2l', id: '6a47903ff4aac7e262810f69' },
  { match: 'liquid detergent/uktra freshness 3l/', sku: 'LD-9X-3L', cloud: 'enjoyful/products/home-care/laundry/liquid-detergent-3l', id: '6a47903ef4aac7e262810f68' },

  // MULTI PURPOSE CLEANER
  { match: 'multi purpose cleaner/', sku: 'MP-BS-750', cloud: 'enjoyful/products/home-care/floor-surface/multi-purpose-cleaner', id: '6a47902af4aac7e262810f53' },

  // PURE SHIELD ANTISEPTIC
  { match: 'pure shield antoseptic/antiseptic_cleaner_750ml', sku: 'DC-PS-750', cloud: 'enjoyful/products/home-care/bathroom/disinfectant-750ml', id: '6a47902bf4aac7e262810f54' },
  { match: 'pure shield antoseptic/disenfectant cleaner 5l', sku: 'DC-PS-5L', cloud: 'enjoyful/products/home-care/bathroom/disinfectant-5l', id: '6a47902cf4aac7e262810f55' },

  // TOILET CLEANER
  { match: 'toilet cleaner/pine scent/', sku: 'TC-PIN-750', cloud: 'enjoyful/products/home-care/bathroom/toilet-cleaner-pine', id: '6a479022f4aac7e262810f4a' },
  { match: 'toilet cleaner/aqua fresh/', sku: 'TC-AQA-750', cloud: 'enjoyful/products/home-care/bathroom/toilet-cleaner-aqua', id: '6a479023f4aac7e262810f4b' },
];

// ── SKIP these files/folders (combo shots, non-product-specific) ──
const FLAGGED_PATHS = [
  'handwash/1l all 3 varient/',   // Combo shot of all 3 handwash variants
  'toilet cleaner/combo.png',      // Combo shot of both toilet cleaner variants
];

// ── Helpers ──
const SKIP_FILES = new Set(['.ds_store', 'thumbs.db', '.gitkeep']);

function walkSync(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkSync(full));
    } else if (!SKIP_FILES.has(entry.name.toLowerCase())) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) results.push(full);
    }
  }
  return results;
}

function resolveMapping(absolutePath) {
  const rel = path.relative(MOCKUP_ROOT, absolutePath).replace(/\\/g, '/').toLowerCase();
  // Check if flagged
  for (const f of FLAGGED_PATHS) {
    if (rel.includes(f)) return { flagged: true, reason: `Combo/group shot: ${rel}` };
  }
  // Find best match (longest match first)
  let best = null;
  for (const entry of IMAGE_MAP) {
    if (rel.startsWith(entry.match) || rel.includes(entry.match)) {
      if (!best || entry.match.length > best.match.length) best = entry;
    }
  }
  return best ? { mapping: best } : { unmatched: true, path: rel };
}

function cleanPublicId(filename, cloudFolder) {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext);
  base = base.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${cloudFolder}/${base}`;
}

async function toWebp(src) {
  const base = path.basename(src, path.extname(src));
  const dest = path.join(TMP_DIR, `${base}-${Date.now()}.webp`);
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  await sharp(src).webp({ quality: 85, effort: 4 }).resize({ width: 1200, withoutEnlargement: true }).toFile(dest);
  return dest;
}

async function uploadFile(localPath, publicId) {
  const result = await cloudinary.uploader.upload(localPath, {
    public_id: publicId, resource_type: 'image', overwrite: true, invalidate: true,
  });
  return result.secure_url;
}

// ── Main ──
async function main() {
  console.log('🔍 Scanning', MOCKUP_ROOT);
  const allFiles = walkSync(MOCKUP_ROOT);
  console.log(`   Found ${allFiles.length} image files\n`);

  // Classify each file
  const queue = [];     // { src, mapping }
  const flagged = [];   // combo/group shots
  const unmatched = []; // no mapping found

  for (const f of allFiles) {
    const result = resolveMapping(f);
    if (result.flagged) flagged.push(result.reason);
    else if (result.unmatched) unmatched.push(result.path);
    else queue.push({ src: f, mapping: result.mapping });
  }

  // Report
  if (flagged.length) {
    console.log(`⚠️  ${flagged.length} FLAGGED (combo/group shots — skipped):`);
    flagged.forEach(f => console.log(`   ${f}`));
    console.log();
  }
  if (unmatched.length) {
    console.log(`❌ ${unmatched.length} UNMATCHED (no product mapping found):`);
    unmatched.forEach(u => console.log(`   ${u}`));
    console.log();
  }

  // Group by product ID for ordering
  const byProduct = {};
  for (const item of queue) {
    const pid = item.mapping.id;
    if (!byProduct[pid]) byProduct[pid] = { mapping: item.mapping, files: [] };
    byProduct[pid].files.push(item.src);
  }

  // Sort files within each product naturally (1, 2, 3...)
  for (const pid of Object.keys(byProduct)) {
    byProduct[pid].files.sort((a, b) => {
      const na = path.basename(a).replace(/[^0-9]/g, '') || '0';
      const nb = path.basename(b).replace(/[^0-9]/g, '') || '0';
      return parseInt(na) - parseInt(nb);
    });
  }

  console.log(`📤 Uploading ${queue.length} images for ${Object.keys(byProduct).length} products...\n`);

  // Upload and collect URLs per product
  const productUrls = {};  // pid → [url, ...]
  let done = 0;
  const errors = [];

  for (const [pid, { mapping, files }] of Object.entries(byProduct)) {
    productUrls[pid] = [];
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map(async (src) => {
        const filename = path.basename(src);
        const publicId = cleanPublicId(filename, mapping.cloud);
        try {
          const webpPath = await toWebp(src);
          const url = await uploadFile(webpPath, publicId);
          done++;
          process.stdout.write(`\r   [${done}/${queue.length}] ${filename.slice(0, 50).padEnd(50)}`);
          return { src, url, publicId };
        } catch (err) {
          errors.push({ file: path.relative(MOCKUP_ROOT, src), error: err.message });
          return null;
        }
      }));
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          productUrls[pid].push(r.value);
        }
      }
    }
  }

  process.stdout.write('\n\n');

  // Save URL map
  const urlMapPath = path.join(__dirname, 'cloudinary-urls-homecare.json');
  const urlMap = {};
  for (const [pid, urls] of Object.entries(productUrls)) {
    urlMap[pid] = urls.map(u => ({ url: u.url, publicId: u.publicId, file: path.basename(u.src) }));
  }
  fs.writeFileSync(urlMapPath, JSON.stringify(urlMap, null, 2));
  console.log(`📄 URL map saved: ${urlMapPath}`);

  // ── Update MongoDB ──
  console.log('\n🔄 Updating MongoDB...\n');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  let updated = 0;

  for (const [pid, urls] of Object.entries(productUrls)) {
    if (!urls.length) continue;
    // Sort by original file order (already sorted)
    const images = urls.map((u, i) => ({
      url: u.url, publicId: u.publicId, alt: '', isPrimary: i === 0,
    }));
    const primaryUrl = images[0].url;

    const result = await db.collection('products').updateOne(
      { _id: new mongoose.Types.ObjectId(pid) },
      { $set: { image: primaryUrl, images: images } }
    );

    const m = IMAGE_MAP.find(e => e.id === pid);
    console.log(`   ✅ ${m ? m.sku : pid}: ${images.length} images → ${result.modifiedCount ? 'UPDATED' : 'NO CHANGE'}`);
    if (result.modifiedCount) updated++;
  }

  console.log(`\n✅ Done! Uploaded: ${done} | Updated: ${updated} products | Errors: ${errors.length}`);

  // Products without images
  const NO_IMAGE_PRODUCTS = [
    { sku: 'BL-1L', name: 'Bleach 1L' },
    { sku: 'BL-3784', name: 'Bleach 3.78L' },
    { sku: 'CG-CIT-1KG', name: 'Citrus Burst Cleaning Gel 1 Kg' },
    { sku: 'CG-LAV-1KG', name: 'Lavender Cleaning Gel 1 Kg' },
    { sku: 'CC-LEM-1L', name: 'Lemon Fresh Multi-Purpose Cream Cleaner 1L (images assigned to 750ml)' },
  ];
  console.log(`\n⚠️  ${NO_IMAGE_PRODUCTS.length} products have NO matching images in the Mockup folder:`);
  NO_IMAGE_PRODUCTS.forEach(p => console.log(`   ${p.sku}: ${p.name}`));

  if (errors.length) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   ${e.file}: ${e.error}`));
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
