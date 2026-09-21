/**
 * Reconcile ENJOYFUL CLEANING PRODUCTS PRICE.pdf with existing Home Care SKUs.
 *
 * PDF price = current/base price.
 * Storefront price = PDF price * 1.25, rounded to two decimals.
 *
 * Dry run (default): node src/database/update-cleaning-prices-from-pdf.js
 * Apply:             node src/database/update-cleaning-prices-from-pdf.js --apply
 */
'use strict';

require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const PDF_PATH = path.resolve(__dirname, '..', '..', '..', 'ENJOYFUL CLEANING PRODUCTS PRICE.pdf');
const APPLY = process.argv.includes('--apply');
const MARKUP_MULTIPLIER = 1.25;

// Rows transcribed from the attached three-page PDF. SKU mappings are existing
// internal identifiers and are never written back or changed by this script.
const PDF_ROWS = [
  [1, '8906081155566', '3x Power Clean Citrus Burst - 5 LTR', 11.50, 'DW-3XCB-5L', '5L'],
  [2, '8906081155429', 'All Purpose Baking Soda - 750 ML', 7.25, 'MP-BS-750', '750ml'],
  [3, '8906081155399', 'Mint Handwash - 5 LTR', 11.50, 'HW-MINT-5L', '5L'],
  [4, '8906081155382', 'Oud Handwash - 5 LTR', 11.00, 'HW-OUD-5L', '5L'],
  [5, '8906081155368', 'Papaya Handwash - 5 LTR', 12.25, 'HW-PAP-5L', '5L'],
  // Barcode corrected after client confirmation; the PDF prints 8926081155306.
  [6, '8906081155306', 'Dishwashing Liquid Aloe & Mint Fresh - 5 LTR', 11.00, 'DW-ALM-5L', '5L'],
  [7, '8906081155290', 'Dishwashing Liquid Apple Breeze - 5 LTR', 14.25, 'DW-APB-5L', '5L'],
  [8, '8906081155283', 'Dishwashing Liquid Lemon Fresh - 5 LTR', 11.25, 'DW-LF-5L', '5L'],
  [9, '8906081155269', 'Abaya Wash - 5 LTR', 17.25, 'AB-5L', '5L'],
  [10, '8906081155375', 'Lavender Handwash - 5 LTR', 11.00, 'HW-LAV-5L', '5L'],
  [11, '8906081155405', 'Antiseptic - 5 LTR', 14.25, 'DC-PS-5L', '5L'],
  [12, '8906081155559', 'Lavender Cleaning Gel 1 kg', 8.25, 'CG-LAV-1KG', '1kg'],
  [13, '8906081155542', 'Citrus Burst Cleaning Gel 1 kg', 8.25, 'CG-CIT-1KG', '1kg'],
  [14, '8906081155511', '3x Power Clean Lavender - 3 LTR', 9.25, 'FL-3XLAV-3L', '3L'],
  [15, '8906081155313', 'Fabric Softener Soft Floral Scents - 3 LTR', 11.00, 'FS-FLR-3L', '3L'],
  [16, '8906081155252', 'Abaya Wash - 3 LTR', 13.50, 'AB-3L', '3L'],
  [17, '8906081155450', 'Bleach - 3.78 LTR', 8.50, 'BL-3784', '3.78L'],
  [18, '8906081155481', '3x Power Clean Pine Floor Cleaner - 3 LTR', 9.25, 'FL-3XPIN-3L', '3L'],
  [19, '8906081155320', 'Fabric Softener Relaxing Lavender - 3 LTR', 11.00, 'FS-LAV-3L', '3L'],
  [20, '8906081155214', '9x Power Clean Ultra Freshness Laundry - 3 LTR', 13.75, 'LD-9X-3L', '3L'],
  [21, '8906081155504', 'Baby Liquid Laundry Detergent 2 LTR', 15.50, null, '2L'],
  [22, '8906081155207', '9x Power Clean Ultra Freshness Laundry - 2 LTR', 10.25, 'LD-9X-2L', '2L'],
  [23, '8906081155221', 'Abaya Wash - 2 LTR', 11.50, null, '2L'],
  [24, '8906081155443', 'Bleach - 1 LTR', 4.25, 'BL-1L', '1L'],
  [25, '8906081155467', 'Lemon Fresh Multi-Purpose Cream Cleaner - 1 LTR', 7.25, 'CC-LEM-1L', '1L'],
  [26, '8906081155337', 'Handwash Rich Musk - 1 LTR', 6.25, 'HW-MUSK-1L', '1L'],
  [27, '8906081155344', 'Handwash Cherry Blossom - 1 LTR', 6.25, 'HW-CHB-1L', '1L'],
  [28, '8906081155351', 'Handwash Sweet Vanilla - 1 LTR', 6.25, 'HW-VAN-1L', '1L'],
  [29, '8906081155276', 'Dishwashing Liquid Lemon Fresh - 1 LTR', 3.25, 'DW-LF-1L', '1L'],
  [30, '8906081155412', 'Antiseptic - 750 ml', 5.25, 'DC-PS-750', '750ml'],
  [31, '8906081155436', 'Glass & Surface Cleaner - 750 ml', 4.25, 'GC-750', '750ml'],
  [32, '8906081155474', 'Lemon Fresh Multi-Purpose Cream Cleaner - 750 ml', 6.25, 'CC-LEM-750', '750ml'],
  // The PDF's single toilet-cleaner price applies to both confirmed scents.
  [33, '8906081155535', 'Ultra Clean Toilet Cleaner 750 Ml', 5.25, ['TC-AQA-750', 'TC-PIN-750'], '750ml'],
  [34, '8906081155528', 'Baby Bottle Cleaning Liquid 500 ml', 12.25, null, '500ml'],
  [35, '6298042340916', 'Detergent Powder 5 kg', 16.00, null, '5kg'],
  [36, '6298042340909', 'Detergent Powder 3 kg', 14.75, null, '3kg'],
  [37, '6298042340923', 'Detergent Powder 2.5 kg box', 13.50, null, '2.5kg'],
].map(function (row) {
  return { no: row[0], barcode: row[1], description: row[2], basePrice: row[3], sku: row[4], size: row[5] };
});

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function canonicalSize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '').replace(/ltr$/, 'l').replace(/gm$/, 'g');
}

function isValidEan13(code) {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = Array.from(code, Number);
  const sum = digits.slice(0, 12).reduce(function (total, digit, index) {
    return total + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!fs.existsSync(PDF_PATH)) throw new Error('PDF not found: ' + PDF_PATH);

  const pdfHash = crypto.createHash('sha256').update(fs.readFileSync(PDF_PATH)).digest('hex');
  const duplicateBarcodes = PDF_ROWS.filter(function (row, index, rows) {
    return rows.findIndex(function (candidate) { return candidate.barcode === row.barcode; }) !== index;
  });
  const duplicateProducts = PDF_ROWS.filter(function (row, index, rows) {
    const key = row.description.toLowerCase().replace(/\s+/g, ' ').trim();
    return rows.findIndex(function (candidate) {
      return candidate.description.toLowerCase().replace(/\s+/g, ' ').trim() === key;
    }) !== index;
  });
  const invalidBarcodes = PDF_ROWS.filter(function (row) { return !isValidEan13(row.barcode); });
  const invalidPrices = PDF_ROWS.filter(function (row) { return !Number.isFinite(row.basePrice) || row.basePrice <= 0; });
  const mappedRows = PDF_ROWS.flatMap(function (row) {
    const skus = Array.isArray(row.sku) ? row.sku : [row.sku];
    return skus.filter(Boolean).map(function (sku) { return { ...row, sku: sku }; });
  });
  const missingInDatabase = PDF_ROWS.filter(function (row) { return row.sku === null; });

  if (duplicateBarcodes.length || duplicateProducts.length || invalidPrices.length) {
    throw new Error('PDF validation failed: duplicate rows/barcodes or invalid prices were found');
  }
  if (invalidBarcodes.length) throw new Error('Invalid confirmed barcodes found');

  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.db.collection('products');
  const skus = mappedRows.map(function (row) { return row.sku; });
  const products = await collection.find({
    $or: [{ productCode: { $in: skus } }, { skuCode: { $in: skus } }],
  }, {
    projection: {
      name: 1, slug: 1, size: 1, variant: 1, productCode: 1, skuCode: 1,
      basePrice: 1, price: 1, currency: 1, category: 1, subcategory: 1,
      images: 1, image: 1, isHidden: 1, barcode: 1,
    },
  }).toArray();

  const matches = [];
  const matchErrors = [];
  for (const row of mappedRows) {
    const candidates = products.filter(function (product) {
      return product.productCode === row.sku || product.skuCode === row.sku;
    });
    if (candidates.length !== 1) {
      matchErrors.push({ row: row.no, sku: row.sku, candidateCount: candidates.length });
      continue;
    }
    const product = candidates[0];
    if (canonicalSize(product.size) !== canonicalSize(row.size)) {
      matchErrors.push({ row: row.no, sku: row.sku, pdfSize: row.size, databaseSize: product.size });
      continue;
    }
    matches.push({
      row: row,
      product: product,
      websitePrice: money(row.basePrice * MARKUP_MULTIPLIER),
    });
  }

  console.log('PDF SHA-256: ' + pdfHash);
  console.log('PDF rows: ' + PDF_ROWS.length);
  console.log('Duplicate PDF barcodes: ' + duplicateBarcodes.length);
  console.log('Duplicate PDF product rows: ' + duplicateProducts.length);
  console.log('Invalid PDF barcodes: ' + invalidBarcodes.length);
  console.log('Invalid PDF prices: ' + invalidPrices.length);
  console.log('Validated existing SKU matches: ' + matches.length);
  console.log('Match errors: ' + matchErrors.length);
  console.log('PDF products missing in database: ' + missingInDatabase.length);

  if (invalidBarcodes.length) {
    console.log('\nPDF barcode issue:');
    invalidBarcodes.forEach(function (row) {
      console.log('  row ' + row.no + ': ' + row.barcode + ' fails EAN-13 checksum (' + row.description + ')');
    });
  }
  if (matchErrors.length) console.log('\nMatch errors:\n' + JSON.stringify(matchErrors, null, 2));
  if (missingInDatabase.length) {
    console.log('\nPDF products missing in database (not created):');
    missingInDatabase.forEach(function (row) {
      console.log('  row ' + row.no + ': ' + row.description + ' | barcode ' + row.barcode + ' | base ' + row.basePrice + ' | website ' + money(row.basePrice * MARKUP_MULTIPLIER));
    });
  }
  console.log('\nValidated price changes:');
  matches.forEach(function (match) {
    console.log('  ' + match.row.no + '. ' + match.product.name + ' ' + match.product.size + ' [' + match.row.sku + '] | base ' + String(match.product.basePrice == null ? 'unset' : match.product.basePrice) + ' -> ' + match.row.basePrice + ' | website ' + match.product.price + ' -> ' + match.websitePrice);
  });

  if (!APPLY) {
    console.log('\nDry run only; no database changes were made.');
    return;
  }
  if (matchErrors.length) throw new Error('Refusing to update because database match errors exist');
  if (matches.length !== mappedRows.length) throw new Error('Refusing to update because not every mapped row was validated');

  const backupDir = path.resolve(__dirname, 'cleaning-price-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, 'cleaning-price-backup-' + stamp + '.json');
  const backup = {
    sourceFile: path.basename(PDF_PATH),
    sourceSha256: pdfHash,
    markupMultiplier: MARKUP_MULTIPLIER,
    createdAt: new Date().toISOString(),
    products: matches.map(function (match) {
      return {
        _id: String(match.product._id),
        name: match.product.name,
        slug: match.product.slug,
        size: match.product.size,
        productCode: match.product.productCode,
        previousBasePrice: match.product.basePrice == null ? null : match.product.basePrice,
        previousWebsitePrice: match.product.price,
        previousBarcode: match.product.barcode == null ? null : match.product.barcode,
        newBasePrice: match.row.basePrice,
        newWebsitePrice: match.websitePrice,
        newBarcode: match.row.no === 6 ? match.row.barcode : match.product.barcode,
        pdfRow: match.row.no,
        pdfBarcode: match.row.barcode,
        pdfDescription: match.row.description,
      };
    }),
  };
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2) + '\n', { flag: 'wx' });

  const now = new Date();
  const operations = matches.map(function (match) {
    return {
      updateOne: {
        filter: { _id: match.product._id, price: match.product.price },
        update: { $set: {
          basePrice: match.row.basePrice,
          price: match.websitePrice,
          ...(match.row.no === 6 ? { barcode: match.row.barcode } : {}),
          updatedAt: now,
        } },
      },
    };
  });
  const result = await collection.bulkWrite(operations, { ordered: true });
  if (result.matchedCount !== matches.length) {
    throw new Error('Concurrent-change guard failed: expected ' + matches.length + ' matches, got ' + result.matchedCount);
  }

  const ids = matches.map(function (match) { return match.product._id; });
  const verified = await collection.find({ _id: { $in: ids } }, { projection: { basePrice: 1, price: 1, barcode: 1 } }).toArray();
  const byId = new Map(verified.map(function (product) { return [String(product._id), product]; }));
  const failures = matches.filter(function (match) {
    const product = byId.get(String(match.product._id));
    return !product || product.basePrice !== match.row.basePrice || product.price !== match.websitePrice ||
      (match.row.no === 6 && product.barcode !== match.row.barcode);
  });
  if (failures.length) throw new Error('Post-update verification failed for ' + failures.length + ' products');

  console.log('\nApplied and verified ' + matches.length + ' cleaning-product price updates.');
  console.log('Modified products: ' + result.modifiedCount);
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
