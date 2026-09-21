/**
 * Restrict storefront visibility to products verified in the two latest price rounds.
 * Dry run: node src/database/reconcile-verified-product-visibility.js
 * Apply:   node src/database/reconcile-verified-product-visibility.js --apply
 */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const RETAIL_BACKUP = path.resolve(__dirname, 'price-update-backups', 'retail-price-backup-2026-09-20T12-43-44-710Z.json');
const CLEANING_BACKUP = path.resolve(__dirname, 'cleaning-price-backups', 'cleaning-price-backup-2026-09-21T15-54-07-853Z.json');

function loadJson(file) {
  if (!fs.existsSync(file)) throw new Error('Required verified-price backup missing: ' + file);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  const retail = loadJson(RETAIL_BACKUP);
  const cleaning = loadJson(CLEANING_BACKUP).products;
  if (!Array.isArray(retail) || retail.length !== 68) throw new Error('Expected exactly 68 verified retail records');
  if (!Array.isArray(cleaning) || cleaning.length !== 32) throw new Error('Expected exactly 32 verified cleaning records');

  const verified = new Map();
  for (const row of retail) {
    if (verified.has(row._id)) throw new Error('Duplicate verified product id: ' + row._id);
    verified.set(row._id, {
      source: 'retail-workbook',
      expectedPrice: row.newPrice,
      expectedBasePrice: undefined,
      productCode: row.productCode,
    });
  }
  for (const row of cleaning) {
    if (verified.has(row._id)) throw new Error('Product appears in both price rounds: ' + row._id);
    verified.set(row._id, {
      source: 'cleaning-pdf',
      expectedPrice: row.newWebsitePrice,
      expectedBasePrice: row.newBasePrice,
      productCode: row.productCode,
    });
  }
  if (verified.size !== 100) throw new Error('Expected exactly 100 unique verified products');

  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.db.collection('products');
  const products = await collection.find({ deletedAt: null }, {
    projection: {
      name: 1, slug: 1, productCode: 1, skuCode: 1, size: 1,
      price: 1, basePrice: 1, isHidden: 1, isActive: 1,
      category: 1, subcategory: 1, images: 1, image: 1,
      createdAt: 1, updatedAt: 1,
    },
  }).toArray();

  const byId = new Map(products.map(function (product) { return [String(product._id), product]; }));
  const missingVerified = Array.from(verified.keys()).filter(function (id) { return !byId.has(id); });
  const priceMismatches = [];
  for (const [id, expected] of verified) {
    const product = byId.get(id);
    if (!product) continue;
    if (product.price !== expected.expectedPrice) {
      priceMismatches.push({ id: id, productCode: product.productCode, actualPrice: product.price, expectedPrice: expected.expectedPrice });
    }
    if (expected.expectedBasePrice !== undefined && product.basePrice !== expected.expectedBasePrice) {
      priceMismatches.push({ id: id, productCode: product.productCode, actualBasePrice: product.basePrice, expectedBasePrice: expected.expectedBasePrice });
    }
  }
  if (missingVerified.length || priceMismatches.length) {
    throw new Error('Verified-set validation failed: missing=' + missingVerified.length + ', price mismatches=' + priceMismatches.length + (priceMismatches.length ? '\n' + JSON.stringify(priceMismatches, null, 2) : ''));
  }

  const confirmed = products.filter(function (product) { return verified.has(String(product._id)); });
  const unconfirmed = products.filter(function (product) { return !verified.has(String(product._id)); });
  const confirmedChanges = confirmed.filter(function (product) { return product.isHidden === true; });
  const unconfirmedChanges = unconfirmed.filter(function (product) {
    return product.isHidden !== true || product.price !== null || product.basePrice !== null;
  });

  console.log('Database products retained: ' + products.length);
  console.log('Verified retail products: ' + retail.length);
  console.log('Verified cleaning products: ' + cleaning.length);
  console.log('Verified products to make visible: ' + confirmedChanges.length);
  console.log('Unverified products to hide and clear: ' + unconfirmedChanges.length);
  console.log('Final expected public SKU count: ' + confirmed.length);
  console.log('Final expected hidden/admin-only SKU count: ' + unconfirmed.length);

  if (!APPLY) {
    console.log('\nDry run only; no database changes were made.');
    return;
  }

  const changed = confirmedChanges.concat(unconfirmedChanges);
  const backupDir = path.resolve(__dirname, 'visibility-update-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, 'verified-visibility-backup-' + stamp + '.json');
  const backup = {
    createdAt: new Date().toISOString(),
    retailBackup: path.basename(RETAIL_BACKUP),
    cleaningBackup: path.basename(CLEANING_BACKUP),
    totalProductsBefore: products.length,
    verifiedProductCount: confirmed.length,
    unverifiedProductCount: unconfirmed.length,
    products: changed.map(function (product) {
      const isVerified = verified.has(String(product._id));
      return {
        _id: String(product._id), name: product.name, slug: product.slug,
        size: product.size, productCode: product.productCode,
        previousPrice: product.price === undefined ? null : product.price,
        previousBasePrice: product.basePrice === undefined ? null : product.basePrice,
        previousIsHidden: product.isHidden === true,
        newPrice: isVerified ? product.price : null,
        newBasePrice: isVerified ? product.basePrice : null,
        newIsHidden: !isVerified,
      };
    }),
  };
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2) + '\n', { flag: 'wx' });

  const now = new Date();
  const operations = [];
  for (const product of confirmedChanges) {
    operations.push({
      updateOne: {
        filter: { _id: product._id, updatedAt: product.updatedAt },
        update: { $set: { isHidden: false, updatedAt: now } },
      },
    });
  }
  for (const product of unconfirmedChanges) {
    operations.push({
      updateOne: {
        filter: { _id: product._id, updatedAt: product.updatedAt },
        update: { $set: { isHidden: true, price: null, basePrice: null, updatedAt: now } },
      },
    });
  }

  const result = operations.length
    ? await collection.bulkWrite(operations, { ordered: true })
    : { matchedCount: 0, modifiedCount: 0 };
  if (result.matchedCount !== operations.length) {
    throw new Error('Concurrent-change guard failed: expected ' + operations.length + ' matches, got ' + result.matchedCount);
  }

  const after = await collection.find({ deletedAt: null }, {
    projection: { price: 1, basePrice: 1, isHidden: 1, isActive: 1 },
  }).toArray();
  const afterById = new Map(after.map(function (product) { return [String(product._id), product]; }));
  const failures = [];
  for (const [id, expected] of verified) {
    const product = afterById.get(id);
    if (!product || product.isHidden === true || product.isActive !== true || product.price !== expected.expectedPrice ||
      (expected.expectedBasePrice !== undefined && product.basePrice !== expected.expectedBasePrice)) {
      failures.push({ id: id, kind: 'verified', actual: product, expected: expected });
    }
  }
  for (const product of unconfirmed) {
    const current = afterById.get(String(product._id));
    if (!current || current.isHidden !== true || current.price !== null || current.basePrice !== null) {
      failures.push({ id: String(product._id), kind: 'unverified', actual: current });
    }
  }
  if (after.length !== products.length || failures.length) {
    throw new Error('Post-update verification failed: retained=' + after.length + '/' + products.length + ', failures=' + failures.length + (failures.length ? '\n' + JSON.stringify(failures.slice(0, 10), null, 2) : ''));
  }

  console.log('\nApplied and verified ' + operations.length + ' visibility/price changes.');
  console.log('Modified products: ' + result.modifiedCount);
  console.log('All ' + products.length + ' products remain in the database/admin set.');
  console.log('Backup: ' + backupPath);
}

main()
  .catch(function (error) {
    console.error('ERROR: ' + error.message);
    process.exitCode = 1;
  })
  .finally(async function () {
    await mongoose.disconnect();
  });
