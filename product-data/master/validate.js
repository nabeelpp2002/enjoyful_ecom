'use strict';
/** Full pre-migration validation of master-skus.json. Read-only. */
const skus = require('/home/nibras-s/Desktop/Projects/enjoyful_ecom/product-data/master/master-skus.json');
const TAXONOMY = {
  Glow: ['Face Wash','Face Scrub','Face Mask','Sunscreen','Aloe Vera Gel','Toner','Body Scrub'],
  Daily: ['Body Lotion','Body Cream','Shower Gel','Shampoo','Hair Oil','Hair Serum','Intimate Wash','Hair Removal'],
  Baby: ['Baby Lotion','Baby Wash','Baby Talc','Baby Rash Cream','Baby Soap'],
  Fragrances: ['Perfume','Body Mist','Roll On','Deo Stick'],
  'Home Care': ['Kitchen Care','Bathroom Care','Floor & Surface Care','Hand Care','Laundry Care'],
};
let problems = 0;
const fail = (label, items) => { if (items.length) { problems += items.length; console.log(`\n❌ ${label} (${items.length}):`); items.forEach(i => console.log('   - ' + i)); } else { console.log(`✅ ${label}: none`); } };

// 1. Duplicate SKUs (same cat|family|size)
const skKey = {}; const dupSku = [];
for (const p of skus) { const k = p.cat+'|'+p.family+'|'+p.size; if (skKey[k]) dupSku.push(`${p.code} "${p.fullName}" == ${skKey[k].code}`); else skKey[k]=p; }
fail('Duplicate SKUs (same product+size)', dupSku);

// 2. Duplicate slugs (must be globally unique — Mongo unique index)
const slugMap = {}; const dupSlug = [];
for (const p of skus) { if (slugMap[p.slug]) dupSlug.push(`slug "${p.slug}": ${p.fullName} & ${slugMap[p.slug].fullName}`); else slugMap[p.slug]=p; }
fail('Duplicate slugs', dupSlug);

// 3. Broken variant groups: a family must have ONE cat + ONE sub, and multi-size members must all have a size
const famG = {};
for (const p of skus) (famG[p.cat+'|'+p.family]=famG[p.cat+'|'+p.family]||[]).push(p);
const broken = [];
for (const [k,v] of Object.entries(famG)) {
  const cats = new Set(v.map(x=>x.cat)), subs = new Set(v.map(x=>x.sub));
  if (subs.size>1) broken.push(`family "${v[0].family}" spans subcategories: ${[...subs].join(', ')}`);
  if (v.length>1 && v.some(x=>!x.size)) broken.push(`family "${v[0].family}" is multi-size but a member has no size`);
  const sizes = v.map(x=>x.size);
  if (new Set(sizes).size !== sizes.length) broken.push(`family "${v[0].family}" has repeated size: ${sizes.join(',')}`);
}
fail('Broken variant groups', broken);

// 4. Family-slug collisions across DIFFERENT base names (two different products → same family slug)
const famBase = {}; const famCollide = [];
for (const p of skus) { if (famBase[p.family] && famBase[p.family]!==p.baseName) famCollide.push(`family "${p.family}": "${p.baseName}" vs "${famBase[p.family]}"`); else famBase[p.family]=p.baseName; }
fail('Family-slug collisions (different products)', [...new Set(famCollide)]);

// 5. Missing / invalid category or subcategory
const badCat = [];
for (const p of skus) {
  if (!TAXONOMY[p.cat]) badCat.push(`${p.fullName}: unknown category "${p.cat}"`);
  else if (!TAXONOMY[p.cat].includes(p.sub)) badCat.push(`${p.fullName}: subcategory "${p.sub}" not in ${p.cat}`);
}
fail('Missing/invalid category or subcategory', badCat);

// 6. Structural required fields
const badReq = [];
for (const p of skus) {
  if (!p.baseName) badReq.push(`${p.code}: empty name`);
  if (!p.slug) badReq.push(`${p.fullName}: empty slug`);
  if (p.variantCount>1 && !p.size) badReq.push(`${p.fullName}: multi-size but no size`);
  if (p.price!=='' && !/^\d+(\.\d+)?$/.test(String(p.price))) badReq.push(`${p.fullName}: non-numeric price "${p.price}"`);
}
fail('Structural / required-field errors', badReq);

// ── Soft (informational) counts ──
console.log('\n──────── informational ────────');
const noPrice = skus.filter(p=>!p.price).length;
const noIng = skus.filter(p=>!p.ingredients.length && !p.shortDesc).length;
const noBen = skus.filter(p=>!p.benefits.length && !p.features.length).length;
console.log(`SKUs: ${skus.length} | products: ${Object.keys(famG).length}`);
console.log(`Missing price:            ${noPrice} SKUs  (all skincare — expected)`);
console.log(`Missing description/desc: ${noIng} SKUs`);
console.log(`Missing benefits/features:${noBen} SKUs`);

// ── Home Care price table (final human check) ──
console.log('\n──────── HOME CARE PRICES (verify) ────────');
const hc = skus.filter(p=>p.cat==='Home Care').sort((a,b)=>a.fullName.localeCompare(b.fullName));
for (const p of hc) console.log(`  ${p.price ? String(p.price).padStart(3) : ' ??'} AED   ${p.fullName}   [${p.sub}]`);

console.log('\n' + (problems ? `⛔ ${problems} blocking problem(s) — fix before import.` : '✅ VALIDATION PASSED — no blocking problems.'));
