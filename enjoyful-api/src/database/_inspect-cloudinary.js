/**
 * READ-ONLY inspection of the live Cloudinary account.
 * Lists top-level folders + counts resources per top-level prefix.
 * Does NOT delete anything. Run from enjoyful-api/:
 *   node src/database/_inspect-cloudinary.js
 */
'use strict';
require('dotenv/config');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listFolders(path) {
  try {
    const res = path
      ? await cloudinary.api.sub_folders(path)
      : await cloudinary.api.root_folders();
    return res.folders.map(f => f.path);
  } catch (e) {
    return [];
  }
}

// Count resources under a prefix (paginated)
async function countPrefix(prefix) {
  let count = 0;
  let next = null;
  const samples = [];
  do {
    const res = await cloudinary.api.resources({
      type: 'upload',
      prefix,
      max_results: 500,
      next_cursor: next,
    });
    count += res.resources.length;
    for (const r of res.resources) if (samples.length < 3) samples.push(r.public_id);
    next = res.next_cursor;
  } while (next);
  return { count, samples };
}

async function main() {
  console.log('Cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('\n=== ROOT FOLDERS ===');
  const roots = await listFolders('');
  console.log(roots);

  // Explore under "enjoyful" (documented root)
  for (const root of roots) {
    console.log(`\n### top-level "${root}" ###`);
    const subs = await listFolders(root);
    console.log('  sub-folders:', subs);
    // count resources per sub-folder prefix
    for (const s of subs) {
      const { count, samples } = await countPrefix(s + '/');
      console.log(`   - ${s}/ : ${count} resources  e.g. ${samples.slice(0,2).join(', ')}`);
    }
    // also count resources directly under root prefix
    const { count } = await countPrefix(root + '/');
    console.log(`  TOTAL under ${root}/ (recursive): ${count}`);
  }

  // Grand total in account
  const { count: grand } = await countPrefix('');
  console.log(`\n=== GRAND TOTAL resources in account: ${grand} ===`);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
