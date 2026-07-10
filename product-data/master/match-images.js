'use strict';
/**
 * Map local source images → product SKUs (by family + size). Read-only; writes a manifest.
 *   node product-data/master/match-images.js
 * Output: product-data/master/image-manifest.json  + a coverage report to stdout.
 */
const fs = require('fs');
const path = require('path');
const ROOT = '/home/nibras-s/Desktop/Projects/enjoyful_ecom/product-data';
const SKIN = path.join(ROOT, 'product-images');
const HOME = path.join(ROOT, 'home-care', 'Mockup');
const skus = require(path.join(ROOT, 'master', 'master-skus.json'));

// ── folder/file fragment → { family, size? } (longest matching key wins) ──
const MAP = [
  // skincare
  ['almond lotion', 'almond-body-lotion'],
  ['almond moisturising cream', 'almond-moisturising-cream'],
  ['aloe vera gel', 'aloevera-gel'],
  ['aloe vera lotion', 'aloevera-body-lotion'],
  ['baby/baby lotion', 'baby-lotion'],
  ['baby/baby powder', 'baby-talc'],
  ['baby/baby rash cream', 'baby-rash-cream'],
  ['baby/baby soap', 'baby-soap'],
  ['cleaning products/baby wash', 'baby-wash'],
  ['body mist/amber glow', 'amber-glow-body-mist'],
  ['body mist/blossom veil', 'blossom-veil-body-mist'],
  ['body mist/coastal pulse', 'coastal-pulse-body-mist'],
  ['body mist/midnight velvet', 'midnight-velvet-body-mist'],
  ['body mist/noir element', 'noir-element-body-mist'],
  ['body mist/vanilla aura', 'vanilla-aura-body-mist'],
  ['daily delight', 'daily-delight-moisturising-cream'],
  ['face scrub/apricot/enjoyfullife_apricot face scrub 150', 'apricot-face-scrub', '150ml'],
  ['face scrub/apricot/enjoyfullife_apricot face scrub 50', 'apricot-face-scrub', '50ml'],
  ['face scrub/coffee scrub/150', 'coffee-face-scrub', '150ml'],
  ['face scrub/coffee scrub/50', 'coffee-face-scrub', '50ml'],
  ['face scrub/enjoyful_walnut apricot/150', 'walnut-apricot-face-scrub', '150ml'],
  ['face scrub/enjoyful_walnut apricot/50', 'walnut-apricot-face-scrub', '50ml'],
  ['face scrub/walnut/', 'walnut-face-scrub', '50ml'],
  ['face wash/charcoal', 'charcoal-face-wash'],
  ['face wash/lemon face wash/150', 'vit-c-lemon-face-wash', '150ml'],
  ['face wash/lemon face wash/60', 'vit-c-lemon-face-wash', '60ml'],
  ['face wash/orange', 'vit-c-orange-face-wash'],
  ['face wash/papaya', 'vit-c-papaya-face-wash'],
  ['hair oil', 'jasmin-oil'],
  ['hair removal cream', 'aloevera-hair-removal-cream'],
  ['mix fruit lotion', 'mix-fruit-body-lotion'],
  ['mix fruit moisturing cream', 'mix-fruit-moisturising-cream'],
  ['moisture balance lotion', 'moisture-balance-body-lotion'],
  ['peel off mask', 'peel-off-mask'],
  ['perfume/100ml/amber imperial', 'amber-imperial'],
  ['perfume/100ml/amber ophir', 'amber-ophir'],
  ['perfume/100ml/atlas oud', 'atlas-oud'],
  ['perfume/100ml/jasmine nomade', 'jasmine-nomade'],
  ['perfume/100ml/noir velours', 'noir-velours'],
  ["perfume/100ml/petal d'amichu", 'petal-d-aamichu'],
  ['perfume/100ml/reine florale', 'reine-florale'],
  ['perfume/100ml/royal safran', 'royal-safran'],
  ['perfume/100ml/zoya flora', 'zoya-flora'],
  ['perfume/50ml/cuir imperial', 'cuir-imperial'],
  ['perfume/50ml/ebène noir', 'ebene-noir'],
  ['perfume/50ml/gold victorie', 'gold-victorie'],
  ['perfume/50ml/imperium noir', 'imperium-noir'],
  ['perfume/50ml/intense aibek', 'intense-aibek'],
  ['perfume/50ml/laichu signature', 'laichu-signature'],
  ['perfume/50ml/minuit noir', 'minuit-noir'],
  ['perfume/50ml/monarach oud', 'monarach-oud'],
  ['perfume/50ml/noir lehan', 'noir-lehan'],
  ['perfume/50ml/obsidien', 'obsidien'],
  ['perfume/50ml/oud prive', 'oud-prive'],
  ['perfume/50ml/safran intense', 'safran-intense'],
  ['roll on/apex 72', 'apex-72h-roll-on'],
  ['roll on/element zero', 'element-zero-roll-on'],
  ['roll on/lumi glow', 'lumi-glow-roll-on'],
  ['roll on/noir oud', 'noir-oud-roll-on'],
  ['roll on/pure renewal', 'pure-renewal-roll-on'],
  ['roll on/velvet repair', 'velvet-repair-roll-on'],
  ['shampoo/aloe calm', 'aloe-calm-shampoo'],
  ['shampoo/bamboo balance', 'bamboo-balance-shampoo'],
  ['shampoo/botanical', 'botanical-deep-clean-shampoo'],
  ['shampoo/onion', 'onion-shampoo'],
  ['shower gel/cglow', 'c-glow-shower-gel'],
  ['shower gel/ice blast', 'ice-blast-shower-gel'],
  ['shower gel/morning buzz', 'morning-buzz-shower-gel'],
  ['sunscreen/mockup/150', 'sunscreen-cream', '150ml'],
  ['sunscreen/mockup/50', 'sunscreen-cream', '50ml'],
  // home care
  ['abaya wash/abaya wash 3l', 'abaya-wash', '3l'],
  ['abaya wash/abaya wash 5l', 'abaya-wash', '5l'],
  ['cream cleaning liquid', 'lemon-fresh-multi-purpose-cream-cleaner'],
  ['dish wash liquid/aloe mint', 'dishwashing-liquid-aloe-and-mint-fresh', '5l'],
  ['dish wash liquid/apple breeze', 'dishwashing-liquid-apple-breeze', '5l'],
  ['dish wash liquid/lemon fresh 5l', 'dishwashing-liquid-lemon-fresh', '5l'],
  ['dish wash liquid/dish wash liquid 1l', 'dishwashing-liquid-lemon-fresh', '1l'],
  ['fabric softner /relaxing lavender', 'fabric-softener-relaxing-lavender'],
  ['fabric softner /soft floral', 'fabric-softener-soft-floral-scents'],
  ['floor cleaner/citrust blast', '3x-power-clean-citrus-burst', '5l'],
  ['floor cleaner/lavender', '3x-power-clean-lavender-floor-disinfectant-cleaner', '3l'],
  ['floor cleaner/pine', '3x-power-clean-pine-floor-disinfectant-cleaner', '3l'],
  ['glass cleaner', 'glass-and-surface-cleaner'],
  ['handwash/5l/lavender', 'lavender-handwash', '5l'],
  ['handwash/5l/mind fresh', 'mint-handwash', '5l'],
  ['handwash/5l/oud royale', 'oud-handwash', '5l'],
  ['handwash/5l/papaya', 'papaya-handwash', '5l'],
  ['handwash/cherry blossam/1l', 'cherry-blossom-handwash', '1l'],
  ['handwash/cherry blossam/500ml', 'cherry-blossom-handwash', '500ml'],
  ['handwash/rich musk/1l', 'rich-musk-handwash', '1l'],
  ['handwash/rich musk/500ml', 'rich-musk-handwash', '500ml'],
  ['handwash/vanila scent/1l', 'sweet-vanilla-handwash', '1l'],
  ['handwash/vanila scent/500ml', 'sweet-vanilla-handwash', '500ml'],
  ['liquid detergent/uktra freshness 3l', '9x-power-clean-ultra-freshness', '3l'],
  ['liquid detergent/ultra freshness 2l', '9x-power-clean-ultra-freshness', '2l'],
  ['multi purpose cleaner', 'all-purpose-baking-soda'],
  ['pure shield antoseptic/antiseptic_cleaner_750ml', 'pure-shield-disinfectant-cleaner', '750ml'],
  ['pure shield antoseptic/disenfectant cleaner 5l', 'pure-shield-disinfectant-cleaner', '5l'],
  ['toilet cleaner/aqua fresh', 'ultra-clean-toilet-cleaner-aqua'],
  ['toilet cleaner/pine scent', 'ultra-clean-toilet-cleaner-pine'],
];

function walk(dir, base) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) out.push(...walk(fp, base));
    else if (/\.(png|jpe?g|avif)$/i.test(name) && !/\.ds_store/i.test(name)) out.push(path.relative(base, fp));
  }
  return out;
}
const files = [
  ...walk(SKIN, SKIN).map(f => ({ rel: f, abs: path.join(SKIN, f) })),
  ...walk(HOME, HOME).map(f => ({ rel: f, abs: path.join(HOME, f) })),
];

// assign each file to family/size via longest matching key
const unmatched = [];
const buckets = {}; // family -> { size|'_' -> [abs...] }
const stripApos = s => s.replace(/['’]/g, '');
for (const f of files) {
  const rel = stripApos(f.rel.toLowerCase().replace(/\.(png|jpe?g|avif)$/, ''));
  let best = null;
  for (const [key, family, size] of MAP) if (rel.includes(stripApos(key)) && (!best || key.length > best[0].length)) best = [key, family, size];
  if (!best) { unmatched.push(f.rel); continue; }
  const [, family, size] = best;
  (buckets[family] = buckets[family] || {});
  const k = size || '_';
  (buckets[family][k] = buckets[family][k] || []).push(f.abs);
}

// pick primary + alternates from a file list
function order(list) {
  return list.slice().sort((a, b) => {
    const ba = path.basename(a).replace(/\.[^.]+$/, '').toLowerCase();
    const bb = path.basename(b).replace(/\.[^.]+$/, '').toLowerCase();
    const pa = ba.endsWith('21') ? 0 : (/(^|[^\d])1$/.test(ba) ? 1 : 2);
    const pb = bb.endsWith('21') ? 0 : (/(^|[^\d])1$/.test(bb) ? 1 : 2);
    return pa - pb || ba.localeCompare(bb, undefined, { numeric: true });
  });
}

// build manifest per SKU
const manifest = [];
const famList = {};
for (const p of skus) (famList[p.family] = famList[p.family] || []).push(p);

const noImg = [];
for (const p of skus) {
  const fam = buckets[p.family];
  let pick = null;
  if (fam) {
    if (p.size && fam[p.size]) pick = fam[p.size];
    else if (fam['_']) pick = fam['_'];
    else pick = fam[Object.keys(fam)[0]]; // fallback: any size's images
  }
  if (!pick || !pick.length) { noImg.push(p.slug); manifest.push({ slug: p.slug, family: p.family, publicId: p.imagePublicId, folder: p.imageFolder, primary: null, alternates: [] }); continue; }
  const ord = order(pick);
  manifest.push({ slug: p.slug, family: p.family, publicId: p.imagePublicId, folder: p.imageFolder, primary: ord[0], alternates: ord.slice(1, 4) });
}

fs.writeFileSync(path.join(ROOT, 'master', 'image-manifest.json'), JSON.stringify(manifest, null, 2));

// ── report ──
console.log(`Local image files scanned: ${files.length}`);
console.log(`Families with images: ${Object.keys(buckets).length}`);
const withImg = manifest.filter(m => m.primary).length;
console.log(`SKUs WITH image: ${withImg} / ${skus.length}`);
console.log(`SKUs WITHOUT image (→ will be hidden): ${noImg.length}`);
console.log('\n── products with NO image (by family) ──');
const noImgFams = [...new Set(noImg.map(s => skus.find(p => p.slug === s)).map(p => `${p.cat} > ${p.sub} > ${p.baseName}`))].sort();
noImgFams.forEach(f => console.log('   ✗ ' + f));
console.log('\n── UNMATCHED local files (not assigned to any product) ──');
if (!unmatched.length) console.log('   (none)');
unmatched.sort().forEach(u => console.log('   ? ' + u));
