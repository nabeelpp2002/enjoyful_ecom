/**
 * Enjoyful Life — Cloudinary Upload Script
 *
 * Converts every local product image (PNG/JPG) to WebP using sharp,
 * then uploads to Cloudinary under the correct organised folder path.
 *
 * Prerequisites:
 *   cd enjoyful-api && npm install sharp cloudinary --save-dev
 *   (cloudinary v2 is already installed as a prod dep in enjoyful-api)
 *
 * Usage:
 *   $env:CLOUDINARY_CLOUD_NAME = "djejbpz0j"
 *   $env:CLOUDINARY_API_KEY    = "your-api-key"
 *   $env:CLOUDINARY_API_SECRET = "your-api-secret"
 *   npx ts-node --esModuleInterop --skipLibCheck product-data/cloudinary-upload.ts
 *
 * Output: product-data/cloudinary-urls.json  (localPath → cloudinaryUrl)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// ── Config ───────────────────────────────────────────────────────────────────

const IMAGES_ROOT = path.join(__dirname, '..', '..', 'product-images');
const OUTPUT_JSON = path.join(__dirname, 'cloudinary-urls.json');
const TMP_DIR = path.join(os.tmpdir(), 'enjoyful-webp');
const CONCURRENCY = 4;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

// ── Path map: local folder prefix → Cloudinary folder ────────────────────────
// Keys are path segments after the IMAGES_ROOT, lowercased for matching.
// Order matters — more specific entries first.

const FOLDER_MAP: Array<{ match: string; cloudFolder: string }> = [
  // GLOW — Face Wash
  { match: 'face wash/lemon face wash/150ml',  cloudFolder: 'enjoyful/products/glow/face-wash/lemon-vit-c' },
  { match: 'face wash/lemon face wash/60ml',   cloudFolder: 'enjoyful/products/glow/face-wash/lemon-vit-c' },
  { match: 'lemon face wash/150ml',            cloudFolder: 'enjoyful/products/glow/face-wash/lemon-vit-c' },
  { match: 'lemon face wash/60ml',             cloudFolder: 'enjoyful/products/glow/face-wash/lemon-vit-c' },
  { match: 'face wash/oranage',                cloudFolder: 'enjoyful/products/glow/face-wash/orange-vit-c' },
  { match: 'oranage',                          cloudFolder: 'enjoyful/products/glow/face-wash/orange-vit-c' },
  { match: 'face wash/papaya',                 cloudFolder: 'enjoyful/products/glow/face-wash/papaya-vit-c' },
  { match: 'papaya',                           cloudFolder: 'enjoyful/products/glow/face-wash/papaya-vit-c' },
  { match: 'face wash/charcoal face wash',     cloudFolder: 'enjoyful/products/glow/face-wash/charcoal' },
  { match: 'charcoal face wash',               cloudFolder: 'enjoyful/products/glow/face-wash/charcoal' },
  // GLOW — Face Scrub
  { match: 'face scrub/coffee scrub/150ml mockup',       cloudFolder: 'enjoyful/products/glow/face-scrub/coffee' },
  { match: 'face scrub/coffee scrub/50ml',               cloudFolder: 'enjoyful/products/glow/face-scrub/coffee' },
  { match: 'face scrub/walnut/mockup 50ml',              cloudFolder: 'enjoyful/products/glow/face-scrub/walnut' },
  { match: 'face scrub/apricot/enjoyfullife_apricot face scrub 150ml/website', cloudFolder: 'enjoyful/products/glow/face-scrub/apricot' },
  { match: 'face scrub/apricot/enjoyfullife_apricot face scrub 50ml',          cloudFolder: 'enjoyful/products/glow/face-scrub/apricot' },
  { match: 'face scrub/enjoyful_walnut apricot/150ml',   cloudFolder: 'enjoyful/products/glow/face-scrub/walnut-apricot' },
  { match: 'face scrub/enjoyful_walnut apricot/50ml mockup', cloudFolder: 'enjoyful/products/glow/face-scrub/walnut-apricot' },
  // GLOW — Face Mask / Sunscreen / Gel / Scrub
  { match: 'peel off mask',          cloudFolder: 'enjoyful/products/glow/face-mask/peel-off' },
  { match: 'sunscreen/mockup/50ml',  cloudFolder: 'enjoyful/products/glow/sunscreen' },
  { match: 'sunscreen/mockup/150ml', cloudFolder: 'enjoyful/products/glow/sunscreen' },
  { match: 'aloe vera gel',          cloudFolder: 'enjoyful/products/glow/aloe-vera-gel' },
  // DAILY — Body Lotion
  { match: 'almond lotion',          cloudFolder: 'enjoyful/products/daily/body-lotion/almond' },
  { match: 'aloe vera lotion',       cloudFolder: 'enjoyful/products/daily/body-lotion/aloevera' },
  { match: 'mix fruit lotion',       cloudFolder: 'enjoyful/products/daily/body-lotion/mix-fruit' },
  { match: 'moisture balance lotion', cloudFolder: 'enjoyful/products/daily/body-lotion/moisture-balance' },
  // DAILY — Body Cream
  { match: 'almond moisturising cream', cloudFolder: 'enjoyful/products/daily/body-cream/almond' },
  { match: 'mix fruit moisturing cream', cloudFolder: 'enjoyful/products/daily/body-cream/mix-fruit' },
  { match: 'daily delight',          cloudFolder: 'enjoyful/products/daily/body-cream/daily-delight' },
  // DAILY — Shower Gel
  { match: 'shower gel/morning buzz', cloudFolder: 'enjoyful/products/daily/shower-gel/morning-buzz' },
  { match: 'shower gel/ice blast',    cloudFolder: 'enjoyful/products/daily/shower-gel/ice-blast' },
  { match: 'shower gel/cglow',        cloudFolder: 'enjoyful/products/daily/shower-gel/c-glow' },
  { match: 'shower gel/aloe bliss',   cloudFolder: 'enjoyful/products/daily/shower-gel/aloe-bliss' },
  // DAILY — Shampoo
  { match: 'shampoo/aloe calm',        cloudFolder: 'enjoyful/products/daily/shampoo/aloe-calm' },
  { match: 'shampoo/bamboo balance',   cloudFolder: 'enjoyful/products/daily/shampoo/bamboo-balance' },
  { match: 'shampoo/botanical shampoo', cloudFolder: 'enjoyful/products/daily/shampoo/botanical-deep-clean' },
  { match: 'shampoo/onion restore',    cloudFolder: 'enjoyful/products/daily/shampoo/onion' },
  // DAILY — Hair
  { match: 'hair oil',            cloudFolder: 'enjoyful/products/daily/hair-oil/jasmin' },
  { match: 'hair removal cream',  cloudFolder: 'enjoyful/products/daily/hair-removal-cream' },
  // BABY
  { match: 'baby/baby lotion',         cloudFolder: 'enjoyful/products/baby/baby-lotion' },
  { match: 'cleaning products/baby wash', cloudFolder: 'enjoyful/products/baby/baby-wash' },
  { match: 'baby/baby powder',         cloudFolder: 'enjoyful/products/baby/baby-talc' },
  { match: 'baby/baby rash cream',     cloudFolder: 'enjoyful/products/baby/baby-rash-cream' },
  { match: 'baby/baby soap',           cloudFolder: 'enjoyful/products/baby/baby-soap' },
  // FRAGRANCES — Perfume 100ml
  { match: 'perfume/100ml/amber imperial',  cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/amber-imperial' },
  { match: 'perfume/100ml/amber ophir',     cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/amber-ophir' },
  { match: 'perfume/100ml/atlas oud',       cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/atlas-oud' },
  { match: 'perfume/100ml/jasmine nomade',  cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/jasmine-nomade' },
  { match: 'perfume/100ml/noir velours',    cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/noir-velours' },
  { match: "perfume/100ml/petal d'amichu",  cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/petal-damichu' },
  { match: 'perfume/100ml/reine florale',   cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/reine-florale' },
  { match: 'perfume/100ml/royal eclat',     cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/royal-eclat' },
  { match: 'perfume/100ml/royal safran',    cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/royal-safran' },
  { match: 'perfume/100ml/zoya flora',      cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/zoya-flora' },
  // FRAGRANCES — Perfume 50ml
  { match: 'perfume/50ml/cuir imperial',    cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/cuir-imperial' },
  { match: 'perfume/50ml/ebène noir',       cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/ebene-noir' },
  { match: 'perfume/50ml/ebene noir',       cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/ebene-noir' },
  { match: 'perfume/50ml/gold victorie',    cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/gold-victorie' },
  { match: 'perfume/50ml/imperium noir',    cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/imperium-noir' },
  { match: 'perfume/50ml/intense aibek',    cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/intense-aibek' },
  { match: 'perfume/50ml/laichu signature', cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/laichu-signature' },
  { match: 'perfume/50ml/minuit noir',      cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/minuit-noir' },
  { match: 'perfume/50ml/monarach oud',     cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/monarach-oud' },
  { match: 'perfume/50ml/noir lehan',       cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/noir-lehan' },
  { match: 'perfume/50ml/obsidien',         cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/obsidien' },
  { match: 'perfume/50ml/oud prive',        cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/oud-prive' },
  { match: 'perfume/50ml/safran intense',   cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/safran-intense' },
  // FRAGRANCES — Body Mist
  { match: 'body mist/amber glow',     cloudFolder: 'enjoyful/products/fragrances/body-mist/amber-glow' },
  { match: 'body mist/blossam',        cloudFolder: 'enjoyful/products/fragrances/body-mist/blossom-veil' },
  { match: 'body mist/costal pulse',   cloudFolder: 'enjoyful/products/fragrances/body-mist/coastal-pulse' },
  { match: 'body mist/midnight velvet', cloudFolder: 'enjoyful/products/fragrances/body-mist/midnight-velvet' },
  { match: 'body mist/noir element',   cloudFolder: 'enjoyful/products/fragrances/body-mist/noir-element' },
  { match: 'body mist/vanila aura',    cloudFolder: 'enjoyful/products/fragrances/body-mist/vanilla-aura' },
  // FRAGRANCES — Roll On
  { match: 'roller/apex 72',      cloudFolder: 'enjoyful/products/fragrances/roll-on/apex-72h' },
  { match: 'roller/element zero', cloudFolder: 'enjoyful/products/fragrances/roll-on/element-zero' },
  { match: 'roller/lumi glow',    cloudFolder: 'enjoyful/products/fragrances/roll-on/lumi-glow' },
  { match: 'roller/noir oud',     cloudFolder: 'enjoyful/products/fragrances/roll-on/noir-oud' },
  { match: 'roller/pure renewal', cloudFolder: 'enjoyful/products/fragrances/roll-on/pure-renewal' },
  { match: 'roller/velvet repair', cloudFolder: 'enjoyful/products/fragrances/roll-on/velvet-repair' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveCloudFolder(absolutePath: string): string | null {
  const rel = path.relative(IMAGES_ROOT, absolutePath).replace(/\\/g, '/').toLowerCase();
  for (const entry of FOLDER_MAP) {
    if (rel.startsWith(entry.match)) return entry.cloudFolder;
  }
  return null;
}

// Standardise "21" thumbnail public_id suffix: strip leading _ / @ / -
function normalisePublicId(filename: string, cloudFolder: string): string {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext);
  // Remove all non-word chars from the base for a clean public_id
  base = base.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${cloudFolder}/${base}`;
}

// Skip these files
const SKIP = new Set(['.ds_store', 'thumbs.db', '.gitkeep']);

function walkSync(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkSync(full));
    } else if (!SKIP.has(entry.name.toLowerCase())) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        results.push(full);
      }
    }
  }
  return results;
}

async function toWebp(src: string): Promise<string> {
  const base = path.basename(src, path.extname(src));
  const dest = path.join(TMP_DIR, `${base}.webp`);
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  await sharp(src)
    .webp({ quality: 85, effort: 4 })
    .toFile(dest);
  return dest;
}

async function uploadFile(localPath: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: true,
    invalidate: true,
  });
  return result.secure_url;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Scanning', IMAGES_ROOT);
  const allFiles = walkSync(IMAGES_ROOT);
  console.log(`   Found ${allFiles.length} image files`);

  const queue: Array<{ src: string; cloudFolder: string }> = [];
  const skipped: string[] = [];

  for (const f of allFiles) {
    const cloudFolder = resolveCloudFolder(f);
    if (!cloudFolder) {
      skipped.push(path.relative(IMAGES_ROOT, f));
    } else {
      queue.push({ src: f, cloudFolder });
    }
  }

  if (skipped.length) {
    console.log(`\n⚠️  ${skipped.length} files have no folder mapping (will be skipped):`);
    skipped.forEach(s => console.log(`   ${s}`));
  }

  console.log(`\n📤 Uploading ${queue.length} files (concurrency: ${CONCURRENCY})...\n`);

  const urlMap: Record<string, string> = {};
  let done = 0;
  const errors: Array<{ file: string; error: string }> = [];

  // Process in batches
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async ({ src, cloudFolder }) => {
        const filename = path.basename(src);
        const publicId = normalisePublicId(filename, cloudFolder);
        try {
          const webpPath = await toWebp(src);
          const url = await uploadFile(webpPath, publicId);
          urlMap[path.relative(IMAGES_ROOT, src)] = url;
          done++;
          process.stdout.write(`\r   [${done}/${queue.length}] ${filename.slice(0, 50).padEnd(50)}`);
        } catch (err) {
          errors.push({ file: path.relative(IMAGES_ROOT, src), error: (err as Error).message });
        }
      })
    );
  }

  process.stdout.write('\n');

  // Save output
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(urlMap, null, 2), 'utf8');

  console.log(`\n✅ Done!`);
  console.log(`   Uploaded:  ${done}`);
  console.log(`   Errors:    ${errors.length}`);
  if (errors.length) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
  }
  console.log(`\n📄 URL map saved to: ${OUTPUT_JSON}`);
  console.log('\nNext: run update-cloudinary-urls.ts to patch MongoDB with new URLs');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
