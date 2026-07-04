/**
 * Enjoyful Life — AI Catalog Enrichment Script
 *
 * Reads the XLSX product spreadsheet, calls Claude to generate rich catalog
 * content for each product (descriptions, SEO, features, usage, precautions),
 * and writes a JSON file ready for import via the admin bulk-import endpoint.
 *
 * Usage:
 *   1. Install dependencies (from repo root):
 *        cd enjoyful-api && npm install   (xlsx and @anthropic-ai/sdk already installed)
 *
 *   2. Set your API key in the environment:
 *        $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *
 *   3. Run:
 *        npx ts-node -e "require('./product-data/enrich-catalog.ts')"
 *      OR compile to JS first:
 *        npx tsc --esModuleInterop --resolveJsonModule --outDir /tmp product-data/enrich-catalog.ts
 *        node /tmp/enrich-catalog.js
 *
 *   4. Output: product-data/enriched-catalog.json
 *      Import it at: Admin → Bulk Import → JSON tab
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const XLSX_PATH = path.join(__dirname, 'Enjoyful_Life_Products_Full_INCI_with_Benefits.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'enriched-catalog.json');
const CONCURRENCY = 3; // Claude API calls in parallel

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Category / subcategory inference (mirrors products.service.ts) ────────────

function inferCatalogFields(name: string): {
  category: string; subcategory: string; productType: string;
  targetUse: string; itemForm: string; scent: string; texture: string; suitableFor: string[];
} {
  const n = name.toLowerCase();
  if (n.includes('perfume') || n.includes('fragrance') || n.includes('eau de'))
    return { category: 'Fragrances', subcategory: 'Perfume', productType: 'Perfume', targetUse: 'Body', itemForm: 'Spray', scent: 'Floral', texture: '', suitableFor: ['Men', 'Women'] };
  if (n.includes('body mist'))
    return { category: 'Fragrances', subcategory: 'Body Mist', productType: 'Body Mist', targetUse: 'Body', itemForm: 'Spray', scent: 'Fresh', texture: 'Lightweight', suitableFor: ['Men', 'Women'] };
  if (n.includes('roll on'))
    return { category: 'Fragrances', subcategory: 'Roll On', productType: 'Roll On', targetUse: 'Body', itemForm: 'Roll-On', scent: 'Fresh', texture: '', suitableFor: ['Men', 'Women'] };
  if (n.includes('deo stick') || n.includes('deodorant'))
    return { category: 'Fragrances', subcategory: 'Deo Stick', productType: 'Deo Stick', targetUse: 'Body', itemForm: 'Stick', scent: 'Fresh', texture: '', suitableFor: ['Men', 'Women'] };
  if (n.includes('baby lotion'))
    return { category: 'Baby', subcategory: 'Baby Lotion', productType: 'Baby Lotion', targetUse: 'Baby Care', itemForm: 'Lotion', scent: 'Unscented', texture: 'Creamy', suitableFor: ['Babies'] };
  if (n.includes('baby wash'))
    return { category: 'Baby', subcategory: 'Baby Wash', productType: 'Baby Wash', targetUse: 'Baby Care', itemForm: 'Gel', scent: 'Unscented', texture: 'Gel-Based', suitableFor: ['Babies'] };
  if (n.includes('baby talc') || n.includes('baby powder'))
    return { category: 'Baby', subcategory: 'Baby Talc', productType: 'Baby Talc', targetUse: 'Baby Care', itemForm: 'Powder', scent: 'Unscented', texture: '', suitableFor: ['Babies'] };
  if (n.includes('baby rash'))
    return { category: 'Baby', subcategory: 'Baby Rash Cream', productType: 'Baby Rash Cream', targetUse: 'Baby Care', itemForm: 'Cream', scent: 'Unscented', texture: 'Creamy', suitableFor: ['Babies'] };
  if (n.includes('baby soap'))
    return { category: 'Baby', subcategory: 'Baby Soap', productType: 'Baby Soap', targetUse: 'Baby Care', itemForm: 'Bar', scent: 'Unscented', texture: 'Smooth', suitableFor: ['Babies'] };
  if (n.includes('face wash') || n.includes('foaming face'))
    return { category: 'Glow', subcategory: 'Face Wash', productType: 'Face Wash', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', suitableFor: ['All Genders'] };
  if (n.includes('face scrub'))
    return { category: 'Glow', subcategory: 'Face Scrub', productType: 'Face Scrub', targetUse: 'Face', itemForm: 'Scrub', scent: 'Herbal', texture: 'Smooth', suitableFor: ['All Genders'] };
  if (n.includes('body scrub'))
    return { category: 'Glow', subcategory: 'Face Scrub', productType: 'Body Scrub', targetUse: 'Body', itemForm: 'Scrub', scent: 'Fresh', texture: 'Smooth', suitableFor: ['All Genders'] };
  if (n.includes('face mask') || n.includes('peel off'))
    return { category: 'Glow', subcategory: 'Face Mask', productType: 'Peel Off Mask', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', suitableFor: ['All Genders'] };
  if (n.includes('sunscreen') || n.includes('spf'))
    return { category: 'Glow', subcategory: 'Sunscreen', productType: 'Sunscreen Cream', targetUse: 'Face', itemForm: 'Cream', scent: 'Unscented', texture: 'Lightweight', suitableFor: ['All Genders'] };
  if (n.includes('aloe vera gel') || n.includes('aloevera gel'))
    return { category: 'Glow', subcategory: 'Aloe Vera Gel', productType: 'Aloe Vera Gel', targetUse: 'Face', itemForm: 'Gel', scent: 'Herbal', texture: 'Gel-Based', suitableFor: ['All Genders'] };
  if (n.includes('rose water') || n.includes('rosewater'))
    return { category: 'Glow', subcategory: 'Toner', productType: 'Rose Water', targetUse: 'Face', itemForm: 'Spray', scent: 'Floral', texture: 'Lightweight', suitableFor: ['All Genders'] };
  if (n.includes('hair serum'))
    return { category: 'Daily', subcategory: 'Hair Serum', productType: 'Hair Serum', targetUse: 'Hair', itemForm: 'Serum', scent: 'Fresh', texture: 'Silky', suitableFor: ['All Genders'] };
  if (n.includes('hair oil') || n.includes('jasmin oil') || n.includes('jasmine oil'))
    return { category: 'Daily', subcategory: 'Hair Oil', productType: 'Hair Oil', targetUse: 'Hair', itemForm: 'Oil', scent: 'Floral', texture: 'Silky', suitableFor: ['All Genders'] };
  if (n.includes('shampoo'))
    return { category: 'Daily', subcategory: 'Shampoo', productType: 'Shampoo', targetUse: 'Hair', itemForm: 'Liquid', scent: 'Fresh', texture: 'Creamy', suitableFor: ['All Genders'] };
  if (n.includes('hair removal'))
    return { category: 'Daily', subcategory: 'Skin Treatment', productType: 'Hair Removal Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', suitableFor: ['Women'] };
  if (n.includes('shower gel'))
    return { category: 'Daily', subcategory: 'Shower Gel', productType: 'Shower Gel', targetUse: 'Body', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', suitableFor: ['All Genders'] };
  if (n.includes('intimate wash'))
    return { category: 'Daily', subcategory: 'Intimate Wash', productType: 'Intimate Wash', targetUse: 'Body', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based', suitableFor: ['Women'] };
  if (n.includes('body lotion') || n.includes('lotion'))
    return { category: 'Daily', subcategory: 'Body Lotion', productType: 'Body Lotion', targetUse: 'Body', itemForm: 'Lotion', scent: 'Fresh', texture: 'Creamy', suitableFor: ['All Genders'] };
  if (n.includes('body cream') || n.includes('moisturising cream') || n.includes('nourish') || n.includes('repair'))
    return { category: 'Daily', subcategory: 'Body Cream', productType: 'Body Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', suitableFor: ['All Genders'] };
  if (n.includes('daily delight'))
    return { category: 'Daily', subcategory: 'Body Cream', productType: 'Moisturising Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', suitableFor: ['All Genders'] };
  return { category: 'Daily', subcategory: 'Body Cream', productType: 'Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy', suitableFor: ['All Genders'] };
}

// ── Claude enrichment ────────────────────────────────────────────────────────

interface RawProduct {
  productCode: string;
  name: string;
  cleanName: string;
  ingredients: string;
  benefits: string[];
  category: string;
  subcategory: string;
  productType: string;
  size: string;
  itemForm: string;
  targetUse: string;
  scent: string;
  texture: string;
  suitableFor: string[];
}

interface EnrichedCatalogEntry {
  productCode: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  productType: string;
  size: string;
  itemForm: string;
  slug: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  activeIngredients: string[];
  ingredients: string[];
  features: string[];
  targetUse: string;
  suitableFor: string[];
  skinType: string[];
  hairType: string[];
  scent: string;
  texture: string;
  howToUse: string;
  recommendedUsage: string;
  precautions: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  searchTags: string[];
  barcode: string;
  shelfLife: string;
  storageInstructions: string;
  countryOfOrigin: string;
  images: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
}

async function enrichProduct(raw: RawProduct): Promise<EnrichedCatalogEntry> {
  const prompt = `You are a Senior E-commerce Product Catalog Specialist for Enjoyful Life, a premium personal care brand targeting UAE and UK markets.

Generate a complete e-commerce product catalog entry for the following product. Return ONLY valid JSON — no markdown, no explanation.

INPUT DATA:
- Product Code: ${raw.productCode}
- Product Name: ${raw.name}
- Category: ${raw.category}
- Subcategory: ${raw.subcategory}
- Product Type: ${raw.productType}
- Size: ${raw.size}
- Item Form: ${raw.itemForm}
- Target Use: ${raw.targetUse}
- Scent: ${raw.scent}
- Texture: ${raw.texture}
- Full INCI Ingredients: ${raw.ingredients}
- Raw Benefits: ${raw.benefits.join(' | ')}

RULES:
1. shortDescription: 50–80 words, professional, customer-focused.
2. description (full): 100–200 words, unique, e-commerce ready.
3. benefits: 4–6 polished benefit statements. Improve wording from the raw benefits.
4. activeIngredients: identify the key functional ingredients from the INCI list.
5. features: 4 feature bullets (e.g. "Dermatologically inspired formulation", "Suitable for daily use").
6. howToUse: realistic, step-by-step instructions.
7. recommendedUsage: frequency (e.g. "Once or twice daily").
8. precautions: standard cosmetic safety wording. NO medical claims.
9. seoTitle: max 60 characters.
10. metaDescription: max 160 characters.
11. keywords: 5–10 search keywords relevant to UAE/UK markets.
12. searchTags: 5–8 short website search tags.
13. skinType: appropriate array e.g. ["All Skin Types"] or ["Dry Skin", "Normal Skin"].
14. hairType: array ONLY if this is a hair product, else empty array [].
15. suitableFor: ["Adults"] or ["Babies"] or ["All Genders"] as appropriate.
16. Do NOT invent barcodes, shelf-life values, or country of origin — use "Pending Client Confirmation".
17. Tone: Premium · Modern · Trustworthy · Family Friendly. NO medical claims.

Return this exact JSON shape (fill every field):
{
  "shortDescription": "",
  "description": "",
  "benefits": [],
  "activeIngredients": [],
  "features": [],
  "howToUse": "",
  "recommendedUsage": "",
  "precautions": "",
  "seoTitle": "",
  "metaDescription": "",
  "keywords": [],
  "searchTags": [],
  "skinType": [],
  "hairType": [],
  "suitableFor": []
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  const enriched = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

  const slugBase = raw.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    productCode: raw.productCode,
    name: raw.name,
    brand: 'Enjoyful Life',
    category: raw.category,
    subcategory: raw.subcategory,
    productType: raw.productType,
    size: raw.size,
    itemForm: raw.itemForm,
    slug: slugBase,
    shortDescription: enriched.shortDescription ?? '',
    description: enriched.description ?? '',
    benefits: enriched.benefits ?? raw.benefits,
    activeIngredients: enriched.activeIngredients ?? [],
    ingredients: raw.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean),
    features: enriched.features ?? [],
    targetUse: raw.targetUse,
    suitableFor: enriched.suitableFor ?? raw.suitableFor,
    skinType: enriched.skinType ?? ['All Skin Types'],
    hairType: enriched.hairType ?? [],
    scent: raw.scent,
    texture: raw.texture,
    howToUse: enriched.howToUse ?? '',
    recommendedUsage: enriched.recommendedUsage ?? '',
    precautions: enriched.precautions ?? '',
    seoTitle: enriched.seoTitle ?? '',
    metaDescription: enriched.metaDescription ?? '',
    keywords: enriched.keywords ?? [],
    searchTags: enriched.searchTags ?? [],
    barcode: 'Pending Client Confirmation',
    shelfLife: 'Pending Client Confirmation',
    storageInstructions: 'Pending Client Confirmation',
    countryOfOrigin: 'Pending Client Confirmation',
    images: 'Pending Product Images',
    price: 0,
    currency: 'AED',
    stock: 0,
    isActive: true,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📂 Reading XLSX:', XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

  const rawProducts: RawProduct[] = [];
  for (const row of rows) {
    const code = (row['Code'] || '').trim();
    const itemName = (row['Item Name'] || '').trim();
    if (!itemName) continue;

    const sizeMatch = itemName.match(/(\d+\s*(?:ml|gm|g|l|kg))/i);
    const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '';
    const cleanName = itemName
      .replace(/^Enjoyful Life\s*/i, '')
      .replace(/\s*\(\d+\)\s*$/, '')
      .trim();

    const benefitsRaw = (row['benifits'] || row['benefits'] || row['Benefits'] || '').trim();
    const benefits = benefitsRaw
      .split('\n')
      .map((b) => b.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    const ingredientsRaw = (row['Ingredients '] || row['Ingredients'] || '').trim();
    const fields = inferCatalogFields(cleanName);

    rawProducts.push({
      productCode: code,
      name: `Enjoyful Life ${cleanName}`,
      cleanName,
      ingredients: ingredientsRaw,
      benefits,
      ...fields,
      size,
    });
  }

  console.log(`✅ Parsed ${rawProducts.length} products from XLSX`);
  console.log('🤖 Starting Claude enrichment (concurrency:', CONCURRENCY, ')...\n');

  const results: EnrichedCatalogEntry[] = [];
  const errors: { index: number; name: string; error: string }[] = [];

  // Process in batches to respect concurrency
  for (let i = 0; i < rawProducts.length; i += CONCURRENCY) {
    const batch = rawProducts.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((p) => enrichProduct(p))
    );
    for (let j = 0; j < batchResults.length; j++) {
      const res = batchResults[j];
      const globalIndex = i + j;
      if (res.status === 'fulfilled') {
        results.push(res.value);
        console.log(`  [${globalIndex + 1}/${rawProducts.length}] ✅ ${batch[j].name}`);
      } else {
        errors.push({ index: globalIndex + 1, name: batch[j].name, error: (res.reason as Error).message });
        console.log(`  [${globalIndex + 1}/${rawProducts.length}] ❌ ${batch[j].name}: ${(res.reason as Error).message}`);
        // Push raw version so the import still has something for this product
        results.push({
          productCode: batch[j].productCode,
          name: batch[j].name,
          brand: 'Enjoyful Life',
          category: batch[j].category,
          subcategory: batch[j].subcategory,
          productType: batch[j].productType,
          size: batch[j].size,
          itemForm: batch[j].itemForm,
          slug: batch[j].name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDescription: '',
          description: '',
          benefits: batch[j].benefits,
          activeIngredients: [],
          ingredients: batch[j].ingredients.split(',').map((s) => s.trim()).filter(Boolean),
          features: [],
          targetUse: batch[j].targetUse,
          suitableFor: batch[j].suitableFor,
          skinType: ['All Skin Types'],
          hairType: [],
          scent: batch[j].scent,
          texture: batch[j].texture,
          howToUse: '',
          recommendedUsage: '',
          precautions: '',
          seoTitle: '',
          metaDescription: '',
          keywords: [],
          searchTags: [],
          barcode: 'Pending Client Confirmation',
          shelfLife: 'Pending Client Confirmation',
          storageInstructions: 'Pending Client Confirmation',
          countryOfOrigin: 'Pending Client Confirmation',
          images: 'Pending Product Images',
          price: 0,
          currency: 'AED',
          stock: 0,
          isActive: true,
        });
      }
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    totalProducts: results.length,
    enrichmentErrors: errors.length,
    errors,
    products: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n✅ Done!');
  console.log(`   Enriched: ${results.length - errors.length}`);
  console.log(`   Fallback (no AI): ${errors.length}`);
  console.log(`   Output: ${OUTPUT_PATH}`);
  console.log('\nNext steps:');
  console.log('  1. Open enriched-catalog.json and set prices for each product.');
  console.log('  2. Go to Admin → Bulk Import → JSON tab.');
  console.log('  3. Paste the "products" array and click Import.');
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
