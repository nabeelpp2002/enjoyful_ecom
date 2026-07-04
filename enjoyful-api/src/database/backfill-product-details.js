/**
 * Enjoyful Life — Backfill Product Detail Templates
 *
 * Fills EMPTY presentation fields (howToUse, recommendedUsage, precautions,
 * skinType, hairType, scent, texture, targetUse, features, suitableFor) with
 * sensible per-product-type defaults so every product page looks complete.
 *
 * NEVER overwrites real Excel data (benefits, ingredients, activeIngredients)
 * or any field that already has a value. Idempotent — safe to re-run.
 *
 * Run from enjoyful-api/:
 *   node src/database/backfill-product-details.js
 */
'use strict';

require('dotenv/config');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const P = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

// Shared feature sets
const F_SKIN = ['Dermatologically inspired formulation', 'Suitable for daily use', 'Gentle, non-irritating formula', 'Made with premium-quality ingredients'];
const F_HAIR = ['Salon-inspired formulation', 'Suitable for regular use', 'Free from harsh sulphates', 'Nourishes from root to tip'];
const F_FRAG = ['Long-lasting fragrance', 'Premium scent composition', 'Elegant, travel-friendly bottle', 'Crafted for all-day wear'];
const F_BABY = ['Hypoallergenic, paediatrician-inspired', 'pH-balanced for delicate skin', 'No harsh chemicals', 'Gentle enough for everyday use'];

// Templates keyed by a substring of subcategory/productType (checked in order).
// Each provides defaults for fields that are commonly empty after the Excel import.
const TEMPLATES = [
  // ── GLOW ───────────────────────────────────────────────────────────────────
  ['face wash', {
    howToUse: 'Massage a small amount onto damp skin in gentle circular motions, avoiding the eye area. Rinse thoroughly with lukewarm water.',
    recommendedUsage: 'Use twice daily, morning and night.',
    precautions: 'For external use only. Avoid direct contact with eyes; if contact occurs, rinse with water. Discontinue use if irritation occurs.',
    skinType: ['All Skin Types'], scent: 'Fresh', texture: 'Gel-Based', targetUse: 'Face',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  ['face scrub', {
    howToUse: 'Apply to damp skin and gently massage in circular motions for 30–60 seconds. Rinse off with lukewarm water and pat dry.',
    recommendedUsage: 'Use 2–3 times a week.',
    precautions: 'For external use only. Avoid the delicate eye area. Do not use on broken or irritated skin.',
    skinType: ['All Skin Types'], scent: 'Herbal', texture: 'Smooth', targetUse: 'Face',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  ['face mask', {
    howToUse: 'Apply an even layer to clean, dry skin avoiding the eyes and lips. Leave for 15–20 minutes until dry, then gently peel off.',
    recommendedUsage: 'Use 1–2 times a week.',
    precautions: 'For external use only. Avoid the eye and brow area. Patch test before first use.',
    skinType: ['All Skin Types'], scent: 'Fresh', texture: 'Gel-Based', targetUse: 'Face',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  ['sunscreen', {
    howToUse: 'Apply generously to the face and exposed skin 15 minutes before sun exposure as the final step of your routine.',
    recommendedUsage: 'Reapply every 2 hours and after swimming or sweating.',
    precautions: 'For external use only. Avoid contact with eyes. Keep out of reach of children.',
    skinType: ['All Skin Types'], scent: 'Unscented', texture: 'Lightweight', targetUse: 'Face',
    suitableFor: ['All Genders'], features: ['Broad-spectrum UVA/UVB protection', 'Lightweight, non-greasy finish', 'Suitable for daily use', 'No white cast'],
  }],
  ['aloe vera gel', {
    howToUse: 'Apply a thin layer to clean skin or hair as needed. Massage gently until absorbed. Can be used on face, body and hair.',
    recommendedUsage: 'Use as often as needed.',
    precautions: 'For external use only. Avoid contact with eyes. Patch test before first use.',
    skinType: ['All Skin Types'], scent: 'Herbal', texture: 'Gel-Based', targetUse: 'Face',
    suitableFor: ['All Genders'], features: ['Multi-use face, body & hair gel', 'Soothing and cooling', 'Lightweight, fast-absorbing', 'Premium-quality formula'],
  }],
  ['toner', {
    howToUse: 'After cleansing, spritz or sweep over the face with a cotton pad. Follow with serum or moisturiser. Avoid the eye area.',
    recommendedUsage: 'Use morning and night.',
    precautions: 'For external use only. Avoid contact with eyes.',
    skinType: ['All Skin Types'], scent: 'Floral', texture: 'Lightweight', targetUse: 'Face',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  // ── DAILY — Hair ────────────────────────────────────────────────────────────
  ['shampoo', {
    howToUse: 'Apply to wet hair and massage into a lather from scalp to ends. Rinse thoroughly. Repeat if needed.',
    recommendedUsage: 'Use as needed, 3–4 times a week.',
    precautions: 'For external use only. Avoid contact with eyes; if contact occurs, rinse with water.',
    hairType: ['All Hair Types'], scent: 'Fresh', texture: 'Creamy', targetUse: 'Hair',
    suitableFor: ['All Genders'], features: F_HAIR,
  }],
  ['hair oil', {
    howToUse: 'Apply a small amount to the scalp and hair, massaging gently. Leave for at least 30 minutes or overnight, then wash off.',
    recommendedUsage: 'Use 2–3 times a week.',
    precautions: 'For external use only. Avoid contact with eyes. Do not apply to broken skin.',
    hairType: ['All Hair Types'], scent: 'Floral', texture: 'Silky', targetUse: 'Hair',
    suitableFor: ['All Genders'], features: F_HAIR,
  }],
  ['hair serum', {
    howToUse: 'Dispense a few drops onto your palms and smooth through damp or dry hair, focusing on mid-lengths and ends. Do not rinse.',
    recommendedUsage: 'Use daily as needed.',
    precautions: 'For external use only. Avoid contact with eyes.',
    hairType: ['All Hair Types'], scent: 'Fresh', texture: 'Silky', targetUse: 'Hair',
    suitableFor: ['All Genders'], features: F_HAIR,
  }],
  // ── DAILY — Body ────────────────────────────────────────────────────────────
  ['shower gel', {
    howToUse: 'Apply to a wet loofah or hands, work into a rich lather and massage over the body. Rinse thoroughly.',
    recommendedUsage: 'Use daily.',
    precautions: 'For external use only. Avoid contact with eyes.',
    skinType: ['All Skin Types'], scent: 'Fresh', texture: 'Gel-Based', targetUse: 'Body',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  ['body lotion', {
    howToUse: 'Massage gently over clean, dry skin until fully absorbed. Reapply as needed, especially after bathing.',
    recommendedUsage: 'Use daily, morning and night.',
    precautions: 'For external use only. Avoid contact with eyes. Discontinue if irritation occurs.',
    skinType: ['All Skin Types', 'Dry Skin'], scent: 'Fresh', texture: 'Creamy', targetUse: 'Body',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  ['body cream', {
    howToUse: 'Massage a generous amount onto clean, dry skin until absorbed, focusing on dry areas.',
    recommendedUsage: 'Use daily, morning and night.',
    precautions: 'For external use only. Avoid contact with eyes. Discontinue if irritation occurs.',
    skinType: ['All Skin Types', 'Dry Skin'], scent: 'Fresh', texture: 'Creamy', targetUse: 'Body',
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
  ['intimate wash', {
    howToUse: 'Apply a small amount to the external intimate area with water, lather gently and rinse thoroughly. For external use only.',
    recommendedUsage: 'Use once or twice daily.',
    precautions: 'For external use only. Do not apply internally. Discontinue use if irritation occurs.',
    skinType: ['Sensitive Skin'], scent: 'Fresh', texture: 'Gel-Based', targetUse: 'Body',
    suitableFor: ['Women'], features: ['pH-balanced formula', 'Gentle on delicate skin', 'Dermatologically inspired', 'Suitable for daily use'],
  }],
  ['hair removal', {
    howToUse: 'Apply an even layer over the area, leave for 5–10 minutes, then remove with the spatula and rinse. Do a patch test first.',
    recommendedUsage: 'Use as needed.',
    precautions: 'For external use only. Do not leave on longer than 10 minutes. Avoid sensitive areas, cuts or irritated skin. Patch test 24 hours before use.',
    skinType: ['All Skin Types'], scent: 'Fresh', texture: 'Creamy', targetUse: 'Body',
    suitableFor: ['Women'], features: F_SKIN,
  }],
  // ── BABY ────────────────────────────────────────────────────────────────────
  ['baby lotion', {
    howToUse: "Gently massage over your baby's clean, dry skin until absorbed, especially after bath time.",
    recommendedUsage: 'Use daily after bathing.',
    precautions: 'For external use only. Avoid contact with eyes. For babies under 3 months, consult your paediatrician.',
    skinType: ['Sensitive Skin'], scent: 'Unscented', texture: 'Creamy', targetUse: 'Baby Care',
    suitableFor: ['Babies'], features: F_BABY,
  }],
  ['baby wash', {
    howToUse: "Apply a small amount to wet skin or a soft sponge, lather gently and rinse with warm water. Avoid the eye area.",
    recommendedUsage: 'Use during every bath.',
    precautions: 'For external use only. Avoid contact with eyes. For babies under 3 months, consult your paediatrician.',
    skinType: ['Sensitive Skin'], scent: 'Unscented', texture: 'Gel-Based', targetUse: 'Baby Care',
    suitableFor: ['Babies'], features: F_BABY,
  }],
  ['baby talc', {
    howToUse: "Smooth a light dusting over your baby's clean, dry skin, avoiding the face. Keep away from the nose and mouth.",
    recommendedUsage: 'Use after bathing and during nappy changes.',
    precautions: 'For external use only. Keep powder away from the face to avoid inhalation. Keep out of reach of children.',
    skinType: ['Sensitive Skin'], scent: 'Unscented', texture: 'Smooth', targetUse: 'Baby Care',
    suitableFor: ['Babies'], features: F_BABY,
  }],
  ['baby rash', {
    howToUse: "Apply a thin layer to clean, dry skin at the first sign of redness, or at each nappy change.",
    recommendedUsage: 'Use at every nappy change as needed.',
    precautions: 'For external use only. Avoid contact with eyes. Consult your paediatrician if irritation persists.',
    skinType: ['Sensitive Skin'], scent: 'Unscented', texture: 'Creamy', targetUse: 'Baby Care',
    suitableFor: ['Babies'], features: F_BABY,
  }],
  ['baby soap', {
    howToUse: "Lather between wet hands or onto a soft sponge, gently cleanse your baby's skin, and rinse with warm water.",
    recommendedUsage: 'Use during every bath.',
    precautions: 'For external use only. Avoid contact with eyes. For babies under 3 months, consult your paediatrician.',
    skinType: ['Sensitive Skin'], scent: 'Unscented', texture: 'Smooth', targetUse: 'Baby Care',
    suitableFor: ['Babies'], features: F_BABY,
  }],
  // ── FRAGRANCES ──────────────────────────────────────────────────────────────
  ['perfume', {
    howToUse: 'Hold 15–20 cm from the skin and spray onto pulse points — wrists, neck and behind the ears. Do not rub.',
    recommendedUsage: 'Apply as desired throughout the day.',
    precautions: 'For external use only. Flammable — keep away from heat and flame. Avoid contact with eyes. Do not spray on broken skin.',
    scent: 'Oriental', texture: 'Lightweight', targetUse: 'Body', skinType: ['All Skin Types'],
    suitableFor: ['Men', 'Women'], features: F_FRAG,
  }],
  ['body mist', {
    howToUse: 'Spray generously all over the body and hair from 20 cm away. Reapply throughout the day for a refreshing lift.',
    recommendedUsage: 'Use as often as desired.',
    precautions: 'For external use only. Flammable — keep away from heat and flame. Avoid contact with eyes.',
    scent: 'Fresh', texture: 'Lightweight', targetUse: 'Body', skinType: ['All Skin Types'],
    suitableFor: ['Men', 'Women'], features: F_FRAG,
  }],
  ['roll on', {
    howToUse: 'Glide evenly over clean, dry underarms or pulse points. Allow to dry before dressing.',
    recommendedUsage: 'Apply once daily, or as needed.',
    precautions: 'For external use only. Do not apply to broken or irritated skin. Avoid contact with eyes.',
    scent: 'Fresh', texture: 'Smooth', targetUse: 'Body', skinType: ['All Skin Types'],
    suitableFor: ['Men', 'Women'], features: F_FRAG,
  }],
  ['deo stick', {
    howToUse: 'Glide evenly over clean, dry underarms. Allow a moment to set before dressing.',
    recommendedUsage: 'Apply once daily, or as needed.',
    precautions: 'For external use only. Do not apply to broken or irritated skin. Avoid contact with eyes.',
    scent: 'Fresh', texture: 'Smooth', targetUse: 'Body', skinType: ['All Skin Types'],
    suitableFor: ['Men', 'Women'], features: F_FRAG,
  }],
  ['body scrub', {
    howToUse: 'Massage onto damp skin in circular motions to exfoliate, then rinse thoroughly with warm water.',
    recommendedUsage: 'Use 2–3 times a week.',
    precautions: 'For external use only. Avoid broken or irritated skin and the eye area.',
    scent: 'Floral', texture: 'Smooth', targetUse: 'Body', skinType: ['All Skin Types'],
    suitableFor: ['All Genders'], features: F_SKIN,
  }],
];

// Generic fallback for anything unmatched
const FALLBACK = {
  howToUse: 'Apply as directed for best results. For external use only.',
  recommendedUsage: 'Use as needed.',
  precautions: 'For external use only. Avoid contact with eyes. Keep out of reach of children. Discontinue use if irritation occurs.',
  skinType: ['All Skin Types'], scent: 'Fresh', texture: 'Smooth', targetUse: 'Body',
  suitableFor: ['All Genders'], features: ['Premium-quality formulation', 'Suitable for regular use', 'Thoughtfully crafted', 'Made for everyday care'],
};

function pickTemplate(product) {
  const hay = `${product.subcategory || ''} ${product.productType || ''}`.toLowerCase();
  for (const [needle, tpl] of TEMPLATES) {
    if (hay.includes(needle)) return tpl;
  }
  return FALLBACK;
}

const isEmpty = (v) => v === undefined || v === null || v === '' ||
  (Array.isArray(v) && v.length === 0);

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const products = await P.find({ deletedAt: null }).lean();
  console.log(`Scanning ${products.length} products...\n`);

  let touched = 0;
  let fieldsFilled = 0;

  for (const p of products) {
    const tpl = pickTemplate(p);
    const set = {};
    for (const [field, value] of Object.entries(tpl)) {
      if (isEmpty(p[field])) { set[field] = value; fieldsFilled++; }
    }
    if (Object.keys(set).length) {
      await P.findByIdAndUpdate(p._id, { $set: set });
      touched++;
      console.log(`  ✅ ${p.name.slice(0, 52).padEnd(52)} +${Object.keys(set).join(', ')}`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Products updated: ${touched}`);
  console.log(`🧩 Empty fields filled: ${fieldsFilled}`);
  console.log('   (benefits / ingredients / activeIngredients left untouched)');
  await mongoose.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
