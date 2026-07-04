/**
 * Enjoyful Life — Re-derive productFamily for every product (authoritative)
 *
 * Fixes substring-collision bugs (e.g. "Walnut Apricot Face Scrub" wrongly
 * folded into "apricot-face-scrub"). Uses ORDERED, specific-before-generic
 * first-match so the most specific family always wins — the same logic as
 * seed-from-excel.js getFamily().
 *
 * Run from enjoyful-api/:
 *   node src/database/fix-product-families.js
 */
'use strict';

require('dotenv/config');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const P = mongoose.model('Product', new mongoose.Schema(
  { name: String, productFamily: String }, { strict: false }
));

// ORDER MATTERS: more specific entries first. getFamily returns the FIRST hit,
// so "walnut apricot face scrub" must precede "apricot face scrub".
const FAMILY_MAP = [
  ['walnut apricot face scrub',        'walnut-apricot-face-scrub'],
  ['walnut face scrub',                'walnut-face-scrub'],
  ['apricot face scrub',               'apricot-face-scrub'],
  ['coffee face scrub',                'coffee-face-scrub'],
  ['roseradiance body scrub',          'roseradiance-body-scrub'],
  ['sapphire night body scrub',        'sapphire-night-body-scrub'],
  ['vit c lemon face wash',            'lemon-face-wash'],
  ['vit c orange face wash',           'orange-face-wash'],
  ['vit c papaya face wash',           'papaya-face-wash'],
  ['vit c foaming face wash',          'foaming-face-wash'],
  ['charcoal face wash',               'charcoal-face-wash'],
  ['peel off mask',                    'peel-off-mask'],
  ['sunscreen cream',                  'sunscreen-cream'],
  ['aloevera gel',                     'aloevera-gel'],
  ['rose water',                       'rose-water-premium'],
  ['almond body lotion',               'almond-body-lotion'],
  ['aloevera body lotion',             'aloevera-body-lotion'],
  ['mix fruit body lotion',            'mix-fruit-body-lotion'],
  ['moisture balance body lotion',     'moisture-balance-body-lotion'],
  ['almond moisturising cream',        'almond-moisturising-cream'],
  ['mix fruit moisturising cream',     'mix-fruit-moisturising-cream'],
  ['daily delight moisturising cream', 'daily-delight-cream'],
  ['nourish plus body cream',          'nourish-plus-body-cream'],
  ['repair plus body cream',           'repair-plus-body-cream'],
  ['morning buzz shower gel',          'morning-buzz-shower-gel'],
  ['ice blast shower gel',             'ice-blast-shower-gel'],
  ['c glow shower gel',                'c-glow-shower-gel'],
  ['aloe bliss shower gel',            'aloe-bliss-shower-gel'],
  ['aloe calm shampoo',                'aloe-calm-shampoo'],
  ['bamboo balance shampoo',           'bamboo-balance-shampoo'],
  ['botanical deep clean shampoo',     'botanical-shampoo'],
  ['onion shampoo',                    'onion-shampoo'],
  ['jasmin oil',                       'jasmin-oil'],
  ['silky touch hair serum',           'silky-touch-hair-serum'],
  ['intimate wash',                    'intimate-wash'],
  ['aloevera hair removal cream',      'aloevera-hair-removal-cream'],
  ['baby lotion',                      'baby-lotion'],
  ['baby wash',                        'baby-wash'],
  ['baby talc',                        'baby-talc'],
  ['baby rash cream',                  'baby-rash-cream'],
  ['baby soap',                        'baby-soap'],
  // Body mists (each scent is its own family across 250ml/70ml)
  ['amber glow body mist',             'amber-glow-body-mist'],
  ['blossom veil body mist',           'blossom-veil-body-mist'],
  ['coastal pulse body mist',          'coastal-pulse-body-mist'],
  ['midnight velvet body mist',        'midnight-velvet-body-mist'],
  ['noir element body mist',           'noir-element-body-mist'],
  ['vanilla aura body mist',           'vanilla-aura-body-mist'],
  // Roll ons
  ['apex 72h roll on',                 'apex-72h-roll-on'],
  ['element zero roll on',             'element-zero-roll-on'],
  ['lumi glow roll on',                'lumi-glow-roll-on'],
  ['noir oud roll on',                 'noir-oud-roll-on'],
  ['pure renewal roll on',             'pure-renewal-roll-on'],
  ['velvet repair roll on',            'velvet-repair-roll-on'],
  // Perfumes (single SKU each — family = itself, harmless but keeps it explicit)
  ['amber imperial',                   'amber-imperial-perfume'],
  ['amber nocturne',                   'amber-nocturne-perfume'],
  ['amber ophir',                      'amber-ophir-perfume'],
  ['atlas oud',                        'atlas-oud-perfume'],
  ['benz lumiere',                     'benz-lumiere-perfume'],
  ['jasmine nomade',                   'jasmine-nomade-perfume'],
  ['noir velours',                     'noir-velours-perfume'],
  ['petal d aamichu',                  'petal-damichu-perfume'],
  ['reine florale',                    'reine-florale-perfume'],
  ['royal eclat',                      'royal-eclat-perfume'],
  ['royal safran',                     'royal-safran-perfume'],
  ['zoya flora',                       'zoya-flora-perfume'],
  ['cuir imperial',                    'cuir-imperial-perfume'],
  ['ebene noir',                       'ebene-noir-perfume'],
  ['gold victorie',                    'gold-victorie-perfume'],
  ['imperium noir',                    'imperium-noir-perfume'],
  ['intense aibek',                    'intense-aibek-perfume'],
  ['laichu signature',                 'laichu-signature-perfume'],
  ['minuit noir',                      'minuit-noir-perfume'],
  ['monarach oud',                     'monarach-oud-perfume'],
  ['noir lehan',                       'noir-lehan-perfume'],
  ['obsidien',                         'obsidien-perfume'],
  ['oud prive',                        'oud-prive-perfume'],
  ['safran intense',                   'safran-intense-perfume'],
  ['pure fresh deo stick',             'pure-fresh-deo-stick'],
  ['silk bloom deo stick',             'silk-bloom-deo-stick'],
  ['ultra fresh deo stick',            'ultra-fresh-deo-stick'],
];

function getFamily(name) {
  const n = name.toLowerCase().replace('enjoyful life ', '');
  for (const [keyword, family] of FAMILY_MAP) {
    if (n.includes(keyword)) return family;
  }
  return null;
}

(async () => {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const products = await P.find({ deletedAt: null }).select('name productFamily').lean();
  let changed = 0, unchanged = 0, unmatched = 0;

  for (const p of products) {
    const fam = getFamily(p.name);
    if (!fam) { console.log(`  ⚠️  No family rule: ${p.name}`); unmatched++; continue; }
    if (p.productFamily === fam) { unchanged++; continue; }
    await P.findByIdAndUpdate(p._id, { $set: { productFamily: fam } });
    console.log(`  🔧 ${p.name}\n        ${p.productFamily || '(none)'} → ${fam}`);
    changed++;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔧 Re-assigned: ${changed}`);
  console.log(`✅ Already correct: ${unchanged}`);
  if (unmatched) console.log(`⚠️  No rule matched: ${unmatched}`);

  // Re-check for any family with >3 members (real families max at 3 = sunscreen)
  const suspicious = await P.aggregate([
    { $match: { productFamily: { $nin: [null, ''] } } },
    { $group: { _id: '$productFamily', n: { $sum: 1 } } },
    { $match: { n: { $gt: 3 } } },
  ]);
  console.log(suspicious.length
    ? `\n⚠️  Still suspicious (>3 members): ${suspicious.map(s => `${s._id}(${s.n})`).join(', ')}`
    : '\n✅ No over-merged families remain.');

  await mongoose.disconnect();
})().catch(e => { console.error('❌', e.message); process.exit(1); });
