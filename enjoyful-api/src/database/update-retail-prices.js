/**
 * Reconcile the retail-price workbook with MongoDB products.
 *
 * Dry run (default):
 *   node src/database/update-retail-prices.js
 *
 * Apply validated matches and verify them:
 *   node src/database/update-retail-prices.js --apply
 */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

const WORKBOOK_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'Enjoyful_Life_Retail_Price_List.xlsx',
);
const APPLY = process.argv.includes('--apply');

function normaliseWords(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function canonicalSize(value) {
  const compact = String(value || '').toLowerCase().replace(/\s+/g, '');
  const match = compact.match(/(\d+(?:\.\d+)?)(ml|gm|kg|g|l)$/i);
  if (!match) return '';
  const unit = match[2] === 'g' ? 'gm' : match[2];
  return `${Number(match[1])}${unit}`;
}

function parseWorkbookDescription(description) {
  const withoutBrand = String(description || '')
    .replace(/^\s*enjoyful\s+life\s+/i, '')
    .trim();
  const sizeMatch = withoutBrand.match(/(\d+(?:\.\d+)?\s*(?:ml|gm|kg|g|l))\s*$/i);
  const size = canonicalSize(sizeMatch ? sizeMatch[1] : '');
  let name = sizeMatch
    ? withoutBrand.slice(0, sizeMatch.index).trim()
    : withoutBrand;

  name = normaliseWords(name);
  const aliases = new Map([
    ['baby powder', 'baby talc'],
    ['amber glow mist', 'amber glow body mist'],
  ]);
  name = aliases.get(name) || name;

  return { name, size };
}

function productKey(name, size) {
  return `${normaliseWords(name)}|${canonicalSize(size)}`;
}

function loadWorkbookRows() {
  const workbook = XLSX.readFile(WORKBOOK_PATH);
  if (workbook.SheetNames.length !== 1) {
    throw new Error(`Expected one worksheet, found ${workbook.SheetNames.length}`);
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const parsed = [];
  const invalid = [];
  for (let index = 2; index < rawRows.length; index += 1) {
    const row = rawRows[index];
    if (!row || row.every((cell) => cell === null || cell === '')) continue;

    const sheetRow = index + 1;
    const itemNo = row[0];
    const description = String(row[2] || '').trim();
    const quotedPrice = Number(row[3]);
    const retailPrice = Number(row[4]);
    const parsedDescription = parseWorkbookDescription(description);
    const expectedRetail = Math.round((quotedPrice * 1.35 + Number.EPSILON) * 100) / 100;

    const problems = [];
    if (!itemNo) problems.push('missing item number');
    if (!description) problems.push('missing description');
    if (!parsedDescription.name) problems.push('missing product name');
    if (!parsedDescription.size) problems.push('missing or invalid size');
    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) problems.push('invalid quoted price');
    if (!Number.isFinite(retailPrice) || retailPrice <= 0) problems.push('invalid retail price');
    if (Number.isFinite(expectedRetail) && Math.abs(expectedRetail - retailPrice) > 0.001) {
      problems.push(`retail price is not quoted price + 35% (${expectedRetail})`);
    }

    const entry = {
      sheetRow,
      itemNo,
      description,
      quotedPrice,
      retailPrice,
      ...parsedDescription,
    };
    if (problems.length) invalid.push({ ...entry, problems });
    else parsed.push(entry);
  }

  return { parsed, invalid };
}

function consolidateRows(rows) {
  const byKey = new Map();
  const conflicts = [];
  for (const row of rows) {
    const key = productKey(row.name, row.size);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...row, sheetRows: [row.sheetRow] });
      continue;
    }
    existing.sheetRows.push(row.sheetRow);
    if (existing.retailPrice !== row.retailPrice || existing.quotedPrice !== row.quotedPrice) {
      conflicts.push({ key, first: existing, conflicting: row });
    }
  }
  return { uniqueRows: [...byKey.values()], conflicts };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  const { parsed, invalid } = loadWorkbookRows();
  const { uniqueRows, conflicts } = consolidateRows(parsed);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}, {
    projection: {
      name: 1,
      slug: 1,
      size: 1,
      price: 1,
      currency: 1,
      productCode: 1,
      skuCode: 1,
      category: 1,
      isHidden: 1,
    },
  }).toArray();

  const exactIndex = new Map();
  const nameIndex = new Map();
  for (const product of products) {
    const exactKey = productKey(product.name, product.size);
    const byExact = exactIndex.get(exactKey) || [];
    byExact.push(product);
    exactIndex.set(exactKey, byExact);

    const nameKey = normaliseWords(product.name);
    const byName = nameIndex.get(nameKey) || [];
    byName.push(product);
    nameIndex.set(nameKey, byName);
  }

  const matches = [];
  const missingInDatabase = [];
  const ambiguous = [];
  for (const row of uniqueRows) {
    const exact = exactIndex.get(productKey(row.name, row.size)) || [];
    if (exact.length === 1) {
      matches.push({ row, product: exact[0], matchType: 'exact name + size' });
      continue;
    }
    if (exact.length > 1) {
      ambiguous.push({ row, candidates: exact, reason: 'duplicate exact database key' });
      continue;
    }

    // A name-only match is accepted only when the database has exactly one SKU
    // for that name. This safely handles known packaging-label discrepancies
    // such as 50ml (workbook) vs 60ml (catalogue) roll-ons.
    const sameName = nameIndex.get(row.name) || [];
    if (sameName.length === 1) {
      matches.push({ row, product: sameName[0], matchType: 'unique name (size differs)' });
    } else if (sameName.length > 1) {
      ambiguous.push({ row, candidates: sameName, reason: 'size not found among multiple SKUs' });
    } else {
      missingInDatabase.push(row);
    }
  }

  const matchedIds = new Set(matches.map(({ product }) => String(product._id)));
  const beautyCategorySlugs = ['glow', 'daily', 'baby', 'fragrances'];
  const beautyCategories = await db.collection('categories')
    .find({ slug: { $in: beautyCategorySlugs } }, { projection: { _id: 1 } })
    .toArray();
  const beautyCategoryIds = new Set(beautyCategories.map((category) => String(category._id)));
  const missingFromWorkbook = products.filter(
    (product) => beautyCategoryIds.has(String(product.category)) && !matchedIds.has(String(product._id)),
  );

  console.log(`Workbook data rows: ${parsed.length + invalid.length}`);
  console.log(`Unique valid workbook products: ${uniqueRows.length}`);
  console.log(`Duplicate workbook rows: ${parsed.length - uniqueRows.length}`);
  console.log(`Validated database matches: ${matches.length}`);
  console.log(`Invalid workbook rows: ${invalid.length}`);
  console.log(`Conflicting duplicate rows: ${conflicts.length}`);
  console.log(`Ambiguous matches: ${ambiguous.length}`);
  console.log(`Workbook products missing in database: ${missingInDatabase.length}`);
  console.log(`Database beauty SKUs missing from workbook: ${missingFromWorkbook.length}`);

  const sizeDifferences = matches.filter(({ matchType }) => matchType.includes('size differs'));
  if (sizeDifferences.length) {
    console.log('\nValidated unique-name matches with a size-label difference:');
    for (const { row, product } of sizeDifferences) {
      console.log(`  row ${row.sheetRow}: ${row.description} -> ${product.name} ${product.size}`);
    }
  }

  if (invalid.length) console.log('\nInvalid workbook rows:', JSON.stringify(invalid, null, 2));
  if (conflicts.length) console.log('\nConflicting duplicate rows:', JSON.stringify(conflicts, null, 2));
  if (ambiguous.length) {
    console.log('\nAmbiguous workbook products:');
    for (const item of ambiguous) {
      console.log(`  row ${item.row.sheetRow}: ${item.row.description} (${item.reason})`);
    }
  }
  if (missingInDatabase.length) {
    console.log('\nWorkbook products missing in database:');
    for (const row of missingInDatabase) console.log(`  row ${row.sheetRow}: ${row.description}`);
  }
  if (missingFromWorkbook.length) {
    console.log('\nDatabase beauty SKUs missing from workbook:');
    for (const product of missingFromWorkbook) {
      console.log(`  ${product.name} | ${product.size || 'no size'} | ${product.productCode || 'no code'} | ${product.isHidden ? 'hidden' : 'visible'}`);
    }
  }

  if (!APPLY) {
    console.log('\nDry run only; no database changes were made.');
    return;
  }

  if (invalid.length || conflicts.length || ambiguous.length) {
    throw new Error('Refusing to update because validation errors or ambiguous matches exist');
  }
  if (!matches.length) throw new Error('Refusing to update because there are no matches');

  const backupDir = path.resolve(__dirname, 'price-update-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `retail-price-backup-${stamp}.json`);
  const backup = matches.map(({ row, product, matchType }) => ({
    _id: String(product._id),
    name: product.name,
    slug: product.slug,
    size: product.size,
    productCode: product.productCode,
    previousPrice: product.price,
    newPrice: row.retailPrice,
    currency: product.currency,
    workbookRow: row.sheetRow,
    workbookDescription: row.description,
    matchType,
  }));
  fs.writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx' });

  const operations = matches.map(({ row, product }) => ({
    updateOne: {
      filter: { _id: product._id, price: product.price },
      update: { $set: { price: row.retailPrice, updatedAt: new Date() } },
    },
  }));
  const result = await db.collection('products').bulkWrite(operations, { ordered: true });
  if (result.matchedCount !== matches.length) {
    throw new Error(`Concurrent-change guard failed: expected ${matches.length} matches, got ${result.matchedCount}`);
  }

  const verificationIds = matches.map(({ product }) => product._id);
  const verified = await db.collection('products')
    .find({ _id: { $in: verificationIds } }, { projection: { price: 1 } })
    .toArray();
  const verifiedPriceById = new Map(verified.map((product) => [String(product._id), product.price]));
  const verificationFailures = matches.filter(
    ({ row, product }) => verifiedPriceById.get(String(product._id)) !== row.retailPrice,
  );
  if (verificationFailures.length) {
    throw new Error(`Post-update verification failed for ${verificationFailures.length} products`);
  }

  console.log(`\nApplied and verified ${matches.length} retail prices.`);
  console.log(`Modified products: ${result.modifiedCount}`);
  console.log(`Backup: ${backupPath}`);
}

main()
  .catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
