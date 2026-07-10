'use strict';
/**
 * enJoyful Life — MASTER catalog generator (canonical).
 * Combines both source Excel files → one clean, de-duplicated, variant-grouped catalog.
 *   node product-data/master/build-master.js
 * Outputs (in product-data/master/):
 *   enJoyful_Master_Catalog.xlsx   — human review workbook
 *   master-skus.json               — one row per SKU (import-ready, enriched with slugs + image paths)
 *   master-products.json           — one row per product family (grouped view)
 */
const XLSX = require('/home/nibras-s/Desktop/Projects/enjoyful_ecom/enjoyful-api/node_modules/xlsx');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/nibras-s/Desktop/Projects/enjoyful_ecom/product-data';
const INCI = path.join(ROOT, 'Enjoyful_Life_Products_Full_INCI_with_Benefits.xlsx');
const HOME = path.join(ROOT, 'home-care', 'enJoyful_Life_Product_Catalog.xlsx');
const OUT = path.join(ROOT, 'master');
fs.mkdirSync(OUT, { recursive: true });

// ── Storefront taxonomy (authoritative, incl. 2 approved new subs) ──
const TAXONOMY = {
  Glow: ['Face Wash', 'Face Scrub', 'Face Mask', 'Sunscreen', 'Aloe Vera Gel', 'Toner', 'Body Scrub'],
  Daily: ['Body Lotion', 'Body Cream', 'Shower Gel', 'Shampoo', 'Hair Oil', 'Hair Serum', 'Intimate Wash', 'Hair Removal'],
  Baby: ['Baby Lotion', 'Baby Wash', 'Baby Talc', 'Baby Rash Cream', 'Baby Soap'],
  Fragrances: ['Perfume', 'Body Mist', 'Roll On', 'Deo Stick'],
  'Home Care': ['Kitchen Care', 'Bathroom Care', 'Floor & Surface Care', 'Hand Care', 'Laundry Care'],
};
const CAT_SLUG = { Glow: 'glow', Daily: 'daily', Baby: 'baby', Fragrances: 'fragrances', 'Home Care': 'home-care' };

const slugify = s => s.toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function sizeSlug(sz){ return sz ? sz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : ''; }
function sizeDisplay(sz){
  if (!sz) return '';
  return sz.replace(/(\d+(?:\.\d+)?)\s*(ml|gm|kg|g|l)\b/i, (m, n, u) => {
    const map = { ml: 'ml', gm: 'gm', g: 'g', kg: ' Kg', l: 'L' };
    return n + map[u.toLowerCase()];
  }).trim();
}
function extractSize(name){ const m = name.match(/(\d+(?:\.\d+)?\s*(?:ml|gm|g|kg|l))\b/i); return m ? m[1].replace(/\s+/g, '').toLowerCase() : ''; }
function cleanName(raw){ return raw.replace(/^enjoyful life\s*/i, '').replace(/\s*\(\d+\)\s*$/, '').replace(/\bPrimium\b/gi, 'Premium').trim(); }
function stripSize(clean){ return clean.replace(/\s*\b\d+(?:\.\d+)?\s*(?:ml|gm|g|kg|l)\b/ig, '').replace(/\s{2,}/g, ' ').trim(); }

function inferINCI(name){
  const n = name.toLowerCase();
  if (n.includes('roll on')) return ['Fragrances', 'Roll On', 'Roll On'];
  if (n.includes('body mist')) return ['Fragrances', 'Body Mist', 'Body Mist'];
  if (n.includes('deo stick') || n.includes('deodorant')) return ['Fragrances', 'Deo Stick', 'Deo Stick'];
  if (n.includes('perfume') || n.includes('fragrance') || n.includes('eau de')) return ['Fragrances', 'Perfume', 'Perfume'];
  if (n.includes('baby lotion')) return ['Baby', 'Baby Lotion', 'Baby Lotion'];
  if (n.includes('baby wash')) return ['Baby', 'Baby Wash', 'Baby Wash'];
  if (n.includes('baby talc') || n.includes('baby powder')) return ['Baby', 'Baby Talc', 'Baby Talc'];
  if (n.includes('baby rash')) return ['Baby', 'Baby Rash Cream', 'Baby Rash Cream'];
  if (n.includes('baby soap')) return ['Baby', 'Baby Soap', 'Baby Soap'];
  if (n.includes('foaming face wash')) return ['Glow', 'Face Wash', 'Foaming Face Wash'];
  if (n.includes('face wash')) return ['Glow', 'Face Wash', 'Face Wash'];
  if (n.includes('charcoal')) return ['Glow', 'Face Wash', 'Charcoal Face Wash'];
  if (n.includes('face scrub')) return ['Glow', 'Face Scrub', 'Face Scrub'];
  if (n.includes('peel off') || n.includes('face mask')) return ['Glow', 'Face Mask', 'Peel Off Mask'];
  if (n.includes('sunscreen') || n.includes('spf')) return ['Glow', 'Sunscreen', 'Sunscreen Cream'];
  if (n.includes('aloevera gel') || n.includes('aloe vera gel') || n.includes('aloe gel')) return ['Glow', 'Aloe Vera Gel', 'Aloe Vera Gel'];
  if (n.includes('rose water') || n.includes('rosewater')) return ['Glow', 'Toner', 'Rose Water Toner'];
  if (n.includes('hair serum') || n.includes('silky touch')) return ['Daily', 'Hair Serum', 'Hair Serum'];
  if (n.includes('hair oil') || n.includes('jasmin oil') || n.includes('jasmine oil')) return ['Daily', 'Hair Oil', 'Hair Oil'];
  if (n.includes('shampoo')) return ['Daily', 'Shampoo', 'Shampoo'];
  if (n.includes('shower gel')) return ['Daily', 'Shower Gel', 'Shower Gel'];
  if (n.includes('intimate wash')) return ['Daily', 'Intimate Wash', 'Intimate Wash'];
  if (n.includes('body lotion') || (n.includes('lotion') && !n.includes('baby'))) return ['Daily', 'Body Lotion', 'Body Lotion'];
  if (n.includes('body cream') || n.includes('moisturising cream') || n.includes('moisturizing cream') || n.includes('nourish') || n.includes('repair') || n.includes('daily delight')) return ['Daily', 'Body Cream', 'Body Cream'];
  if (n.includes('hair removal')) return ['Daily', 'Hair Removal', 'Hair Removal Cream'];
  if (n.includes('body scrub') || n.includes('scrub')) return ['Glow', 'Body Scrub', 'Body Scrub'];
  return ['Daily', 'REVIEW: Unknown', 'Unknown'];
}
function mapHomeSub(webCat){
  const w = (webCat || '').toLowerCase();
  if (w.includes('toilet')) return 'Bathroom Care';
  if (w.includes('hand wash') || w.includes('hand care')) return 'Hand Care';
  if (w.includes('dishwash')) return 'Kitchen Care';
  if (w.includes('fabric') || w.includes('abaya') || w.includes('detergent') || w.includes('laundry')) return 'Laundry Care';
  return 'Floor & Surface Care';
}

// ── Parse INCI (skincare) ──
const rowsI = XLSX.utils.sheet_to_json(XLSX.readFile(INCI).Sheets['Sheet1'], { defval: '' });
let skus = [];
for (const r of rowsI) {
  const itemName = (r['Item Name'] || '').toString().trim();
  if (!itemName) continue;
  const clean = cleanName(itemName);
  let base = stripSize(clean);
  const [cat, sub, ptype] = inferINCI(clean);
  if (ptype === 'Perfume') base = base.replace(/\s*Fragrances\s*$/i, '').trim();   // "Amber Imperial Fragrances" -> "Amber Imperial"
  const ingredients = (r['Ingredients '] || r['Ingredients'] || '').toString().split(',').map(s => s.trim()).filter(Boolean);
  const benefits = (r['benifits'] || '').toString().split(/\r?\n/).map(b => b.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
  skus.push({ source: 'Skincare/INCI', code: (r['Code'] || '').toString().trim(), size: extractSize(itemName),
    cat, sub, productType: ptype, scent: '', baseName: base, price: '', unit: '', shortDesc: '', features: [], ingredients, benefits });
}

// ── Parse Home Care ──
const rowsH = XLSX.utils.sheet_to_json(XLSX.readFile(HOME).Sheets['Master Catalog'], { header: 1, defval: '' });
const hdr = rowsH.findIndex(r => (r[0] || '').toString().trim() === 'SKU Code');
for (const r of rowsH.slice(hdr + 1)) {
  const [sku, pname, catField, scent, size, unit, mock, shortDesc, feats, webCat, price] = r.map(x => (x == null ? '' : x.toString().trim()));
  if (!pname) continue;
  const clean = cleanName(pname);
  let base = stripSize(clean.replace(new RegExp('\\s*' + size.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i'), '').trim());
  const sub = mapHomeSub(webCat);
  if (sub === 'Hand Care' && !/handwash/i.test(base)) base = base + ' Handwash';   // "Sweet Vanilla" -> "Sweet Vanilla Handwash"
  skus.push({ source: 'Home Care', code: sku, size: size.toLowerCase(), cat: 'Home Care', sub, productType: catField, scent,
    baseName: base, price: price || '', unit, shortDesc, features: feats ? feats.split(';').map(s => s.trim()).filter(Boolean) : [],
    ingredients: [], benefits: [], mock });
}

// ── Enrich: slugs, family, image paths ──
for (const p of skus) {
  p.family = slugify(p.baseName);
  p.catSlug = CAT_SLUG[p.cat] || slugify(p.cat);
  p.subSlug = slugify(p.sub.replace('REVIEW: ', ''));
  p.sizeDisplay = sizeDisplay(p.size);
  p.fullName = p.sizeDisplay ? `${p.baseName} ${p.sizeDisplay}` : p.baseName;
}
// family variant counts → SKU slug + image basename
const famCount = {};
for (const p of skus) famCount[p.cat + '|' + p.family] = (famCount[p.cat + '|' + p.family] || 0) + 1;
for (const p of skus) {
  const multi = famCount[p.cat + '|' + p.family] > 1;
  p.variantCount = famCount[p.cat + '|' + p.family];
  p.slug = multi && p.size ? `${p.family}-${sizeSlug(p.size)}` : p.family;
  p.imageBasename = p.slug;
  p.imagePublicId = `enjoyful/products/${p.catSlug}/${p.subSlug}/${p.slug}`;
  p.imageFolder = `${p.catSlug}/${p.subSlug}`;
  p.imageStatus = 'Pending';   // set for real by the image matcher
  p.flags = ['Hair Removal', 'Body Scrub'].includes(p.sub) ? 'NEW subcategory' : (p.sub.startsWith('REVIEW') ? 'SUBCATEGORY NEEDS DECISION' : '');
}

skus.sort((a, b) => (a.cat + a.baseName + a.size).localeCompare(b.cat + b.baseName + b.size, undefined, { numeric: true }));

// ── Grouped products ──
const fams = {};
for (const p of skus) (fams[p.cat + '|' + p.family] = fams[p.cat + '|' + p.family] || []).push(p);
const grouped = Object.values(fams).map(v => {
  const v0 = v[0];
  return {
    'Product Name': v0.baseName, 'Category': v0.cat, 'Subcategory': v0.sub, 'Product Type': v0.productType,
    'Scent/Variant': v0.scent, '# Sizes': v.length, 'Sizes': v.map(x => x.sizeDisplay || '—').join(', '),
    'Price(s) AED': v.map(x => (x.sizeDisplay || '1') + ':' + (x.price || '—')).join('  '),
    'Family (slug)': v0.family, 'Source': v0.source, 'Flags': v.map(x => x.flags).filter(Boolean)[0] || '',
  };
}).sort((a, b) => (a.Category + a['Product Name']).localeCompare(b.Category + b['Product Name']));

// ── Workbook ──
const notes = [
  { Topic: 'TOTAL', Detail: `${skus.length} SKUs → ${Object.keys(fams).length} products (${Object.values(fams).filter(v => v.length > 1).length} multi-size)` },
  { Topic: 'Categories', Detail: 'Glow, Daily, Baby, Fragrances, Home Care (all existing)' },
  { Topic: 'New subcategories', Detail: 'Hair Removal (Daily) + Body Scrub (Glow) — approved.' },
  { Topic: 'Naming', Detail: 'Perfumes: trailing "Fragrances" removed. Home Care handwash: "Handwash" appended.' },
  { Topic: 'Prices', Detail: 'Home Care carries catalog prices; skincare left blank (set later).' },
  { Topic: 'Slugs', Detail: 'SKU slug = family-slug (+ -size when multi-size). Image basename = SKU slug.' },
];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(notes), 'README');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(grouped), 'Products (grouped)');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(skus.map((p, i) => ({
  '#': i + 1, Source: p.source, 'Code/SKU': p.code, 'Product Name': p.fullName, 'Base Name': p.baseName,
  Slug: p.slug, 'Family': p.family, Category: p.cat, Subcategory: p.sub, Size: p.sizeDisplay, 'Unit Type': p.unit,
  'Scent/Variant': p.scent, 'Price AED': p.price, 'Short Description': p.shortDesc, 'Key Features': p.features.join('; '),
  'Ingredients (INCI)': p.ingredients.join(', '), Benefits: p.benefits.join(' | '), 'Cloudinary Public ID': p.imagePublicId, Flags: p.flags,
})), 'SKUs (flat)'));
XLSX.writeFile(wb, path.join(OUT, 'enJoyful_Master_Catalog.xlsx'));
fs.writeFileSync(path.join(OUT, 'master-skus.json'), JSON.stringify(skus, null, 2));
fs.writeFileSync(path.join(OUT, 'master-products.json'), JSON.stringify(grouped, null, 2));

console.log(`WROTE master: ${skus.length} SKUs, ${Object.keys(fams).length} products`);
const pc = {}; for (const g of grouped) pc[g.Category] = (pc[g.Category] || 0) + 1;
console.log('products/category:', pc);
console.log('multi-size families:', Object.values(fams).filter(v => v.length > 1).length);
