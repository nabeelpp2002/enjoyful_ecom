/**
 * Uploads the 5 files skipped by the main upload script.
 * Uses fs.readdirSync to find files — never hardcodes special Unicode chars.
 * Appends new URLs to cloudinary-urls.json.
 *
 * Run from enjoyful-api/:
 *   node src/database/upload-skipped-images.js
 */
'use strict';

require('dotenv/config');
const sharp      = require('sharp');
const { v2: cloudinary } = require('cloudinary');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dk9mwcx68',
  api_key:    process.env.CLOUDINARY_API_KEY    || '152899332391665',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'wjm6TG1iLqMBBlznvAsqIFS12Wo',
  secure: true,
});

const IMAGES_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'product-images');
const OUTPUT_JSON = path.resolve(__dirname, '..', '..', '..', 'product-data', 'cloudinary-urls.json');
const TMP_DIR     = path.join(os.tmpdir(), 'enjoyful-webp-fix');

// ── Folders to scan + their target Cloudinary folder ─────────────────────────
// We use partial name matching (toLowerCase includes) to find the folder
// regardless of Unicode apostrophes or accented characters.
const SCAN_TARGETS = [
  {
    // Apricot 150ml ROOT files (not in /Website subfolder)
    parentDir:   path.join(IMAGES_ROOT, 'Face Scrub', 'Apricot'),
    folderMatch: 'apricot face scrub 150ml',  // matched case-insensitively
    subDir:      null,                          // scan root of that folder (not /Website)
    cloudFolder: 'enjoyful/products/glow/face-scrub/apricot',
    // Only upload files that DON'T have "1000x1000" in the name (those were in /Website and already uploaded)
    fileFilter: (name) => !name.toLowerCase().includes('1000x1000'),
  },
  {
    // PETAL D'AMICHU — any character in apostrophe position
    parentDir:   path.join(IMAGES_ROOT, 'Perfume', '100ml'),
    folderMatch: 'petal',
    subDir:      null,
    cloudFolder: 'enjoyful/products/fragrances/perfume-100ml/petal-damichu',
    fileFilter:  () => true,
  },
  {
    // EBÈNE NOIR — accented E
    parentDir:   path.join(IMAGES_ROOT, 'Perfume', '50ml'),
    folderMatch: 'bene noir',   // 'ebène noir' lowercased contains 'bene noir'
    subDir:      null,
    cloudFolder: 'enjoyful/products/fragrances/perfume-50ml/ebene-noir',
    fileFilter:  () => true,
  },
];

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// Find the first directory inside parentDir whose name contains folderMatch (case-insensitive)
function findFolder(parentDir, match) {
  if (!fs.existsSync(parentDir)) return null;
  const entries = fs.readdirSync(parentDir, { withFileTypes: true });
  const found = entries.find(e => e.isDirectory() && e.name.toLowerCase().includes(match));
  return found ? path.join(parentDir, found.name) : null;
}

// Get image files directly in a directory (not recursive)
function getImagesInDir(dir, fileFilter) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()) && fileFilter(e.name))
    .map(e => path.join(dir, e.name));
}

function makePublicId(cloudFolder, filename) {
  const base = path.basename(filename, path.extname(filename))
    .replace(/[^\w\s-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cloudFolder}/${base}`;
}

async function toWebp(src, label) {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const safe = label.replace(/[^\w-]/g, '_');
  const dest = path.join(TMP_DIR, `${safe}_${Date.now()}.webp`);
  await sharp(src).webp({ quality: 82, effort: 4 }).toFile(dest);
  return dest;
}

async function main() {
  // Load existing URL map
  let urlMap = {};
  if (fs.existsSync(OUTPUT_JSON)) {
    urlMap = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    console.log(`📄 Existing map: ${Object.keys(urlMap).length} URLs\n`);
  }

  let uploaded = 0;
  const errors = [];

  for (const target of SCAN_TARGETS) {
    const folder = findFolder(target.parentDir, target.folderMatch);
    if (!folder) {
      console.log(`⚠️  Folder not found: ${target.parentDir} / *${target.folderMatch}*`);
      continue;
    }
    console.log(`📁 Scanning: ${folder}`);

    const files = getImagesInDir(folder, target.fileFilter);
    if (files.length === 0) {
      console.log('   No matching files found (may already be uploaded)\n');
      continue;
    }

    for (const filePath of files) {
      const relKey = path.relative(IMAGES_ROOT, filePath).replace(/\\/g, '/');

      // Skip if already in map
      if (urlMap[relKey]) {
        console.log(`   ✅ Already uploaded: ${path.basename(filePath)}`);
        continue;
      }

      const publicId = makePublicId(target.cloudFolder, path.basename(filePath));
      process.stdout.write(`   Uploading ${path.basename(filePath)}... `);

      let webpPath = null;
      try {
        webpPath = await toWebp(filePath, path.basename(filePath, path.extname(filePath)));
        const result = await cloudinary.uploader.upload(webpPath, {
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
          invalidate: true,
          format: 'webp',
        });
        urlMap[relKey] = result.secure_url;
        uploaded++;
        console.log(`✅`);
      } catch (err) {
        console.log(`❌ ${err.message}`);
        errors.push({ file: relKey, error: err.message });
      } finally {
        if (webpPath && fs.existsSync(webpPath)) {
          try { fs.unlinkSync(webpPath); } catch {}
        }
      }
    }
    console.log('');
  }

  // Save updated map
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(urlMap, null, 2), 'utf8');

  console.log(`✅ Newly uploaded: ${uploaded}`);
  if (errors.length) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.forEach(e => console.log(`   ${e.file}: ${e.error}`));
  }
  console.log(`\n📄 URL map updated → ${Object.keys(urlMap).length} total URLs`);
  console.log(`\n👉 Next step: node src/database/patch-mongodb-urls.js`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
