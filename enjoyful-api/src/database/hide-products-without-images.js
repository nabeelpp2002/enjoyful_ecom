/**
 * Hide products without usable images, preserve every other field, and export
 * an Excel image-status audit.
 *
 * Dry run: node src/database/hide-products-without-images.js
 * Apply:   node src/database/hide-products-without-images.js --apply
 */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

const APPLY = process.argv.includes('--apply');
const PLACEHOLDER = '/assets/placeholder.png';

function usable(value) {
  return typeof value === 'string' && value.trim() && !value.includes(PLACEHOLDER);
}

function urls(product) {
  const gallery = Array.isArray(product.images)
    ? product.images.map(function (entry) {
        return typeof entry === 'string' ? entry : entry && entry.url;
      })
    : [];
  return Array.from(new Set(
    [product.image, product.hoverImage].concat(gallery).filter(usable),
  ));
}

async function loadProducts(collection) {
  return collection.aggregate([
    { $match: { deletedAt: null } },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    {
      $set: {
        categoryName: { $ifNull: [{ $first: '$categoryDoc.name' }, 'Unknown'] },
      },
    },
    {
      $project: {
        name: 1, slug: 1, size: 1, productCode: 1, skuCode: 1,
        productFamily: 1, categoryName: 1, subcategory: 1,
        price: 1, basePrice: 1, isHidden: 1, isActive: 1,
        image: 1, hoverImage: 1, images: 1, updatedAt: 1,
      },
    },
    { $sort: { categoryName: 1, name: 1, size: 1 } },
  ]).toArray();
}

function row(product) {
  const imageUrls = urls(product);
  return {
    'Product Name': product.name || '',
    Size: product.size || '',
    'Product Code': product.productCode || '',
    'SKU Code': product.skuCode || '',
    Category: product.categoryName || '',
    Subcategory: product.subcategory || '',
    'Price AED': product.price == null ? '' : product.price,
    'Has Image': imageUrls.length ? 'Yes' : 'No',
    Visibility: product.isHidden === true ? 'Hidden' : 'Visible',
    'Image Count': imageUrls.length,
    'Primary Image URL': imageUrls[0] || '',
    'All Image URLs': imageUrls.join('\n'),
    Slug: product.slug || '',
    'Product Family': product.productFamily || '',
  };
}

function formatSheet(sheet, rows) {
  sheet['!cols'] = [
    { wch: 34 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 70 }, { wch: 90 }, { wch: 36 }, { wch: 36 },
  ];
  if (rows.length) sheet['!autofilter'] = { ref: sheet['!ref'] };
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
}

function writeReport(products, changedIds, reportPath) {
  const allRows = products.map(row);
  const withImages = allRows.filter(function (item) { return item['Has Image'] === 'Yes'; });
  const missingImages = allRows.filter(function (item) { return item['Has Image'] === 'No'; });
  const hiddenThisRun = products
    .filter(function (product) { return changedIds.has(String(product._id)); })
    .map(row);
  const summary = [
    { Metric: 'Generated At', Value: new Date().toISOString() },
    { Metric: 'Total Products / SKUs', Value: allRows.length },
    { Metric: 'Products With Images', Value: withImages.length },
    { Metric: 'Products Missing Images', Value: missingImages.length },
    { Metric: 'Hidden During This Run', Value: hiddenThisRun.length },
    { Metric: 'Rule', Value: 'No usable image means hidden; products remain in Admin and are never deleted.' },
  ];

  const workbook = XLSX.utils.book_new();
  const sheets = [
    ['Summary', summary],
    ['Products With Images', withImages],
    ['Missing Images', missingImages],
    ['Hidden This Run', hiddenThisRun],
  ];
  for (const [name, data] of sheets) {
    const sheet = XLSX.utils.json_to_sheet(data);
    if (name === 'Summary') sheet['!cols'] = [{ wch: 30 }, { wch: 100 }];
    else formatSheet(sheet, data);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  XLSX.writeFile(workbook, reportPath);
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);

  const collection = mongoose.connection.db.collection('products');
  const before = await loadProducts(collection);
  if (!before.length) throw new Error('No products found; refusing to continue');

  const missing = before.filter(function (product) { return urls(product).length === 0; });
  const toHide = missing.filter(function (product) { return product.isHidden !== true; });

  console.log('Products retained in Admin/database: ' + before.length);
  console.log('Products with usable images: ' + (before.length - missing.length));
  console.log('Products missing images: ' + missing.length);
  console.log('Missing-image products already hidden: ' + (missing.length - toHide.length));
  console.log('Missing-image products to hide: ' + toHide.length);
  if (toHide.length) {
    console.log('\nProducts to hide:');
    toHide.forEach(function (product) {
      console.log('  ' + product.name + ' | ' + (product.size || 'no size') +
        ' | ' + (product.productCode || 'no code'));
    });
  }

  if (!APPLY) {
    console.log('\nDry run only; no database changes or report files were made.');
    return;
  }

  const backupDir = path.resolve(__dirname, 'image-visibility-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, 'image-visibility-backup-' + stamp + '.json');
  const backup = {
    createdAt: new Date().toISOString(),
    rule: 'Hide products without a usable image; never auto-unhide',
    totalProducts: before.length,
    missingImageProducts: missing.length,
    productsChanged: toHide.length,
    products: toHide.map(function (product) {
      return {
        _id: String(product._id), name: product.name, slug: product.slug,
        size: product.size, productCode: product.productCode,
        previousIsHidden: product.isHidden === true, newIsHidden: true,
        pricePreserved: product.price == null ? null : product.price,
        basePricePreserved: product.basePrice == null ? null : product.basePrice,
        imagePreserved: product.image || '',
        hoverImagePreserved: product.hoverImage || '',
        imagesPreserved: product.images || [],
      };
    }),
  };
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2) + '\n', { flag: 'wx' });

  const now = new Date();
  const operations = toHide.map(function (product) {
    return {
      updateOne: {
        filter: { _id: product._id, updatedAt: product.updatedAt },
        update: { $set: { isHidden: true, updatedAt: now } },
      },
    };
  });
  const result = operations.length
    ? await collection.bulkWrite(operations, { ordered: true })
    : { matchedCount: 0, modifiedCount: 0 };
  if (result.matchedCount !== operations.length) {
    throw new Error('Concurrent-change guard failed: expected ' + operations.length +
      ' matches, got ' + result.matchedCount);
  }

  const after = await loadProducts(collection);
  const visibleWithoutImage = after.filter(function (product) {
    return urls(product).length === 0 && product.isHidden !== true;
  });
  if (after.length !== before.length || visibleWithoutImage.length) {
    throw new Error('Post-update verification failed: retained=' + after.length + '/' +
      before.length + ', visible-without-image=' + visibleWithoutImage.length);
  }

  const changedIds = new Set(toHide.map(function (product) { return String(product._id); }));
  const reportPath = path.resolve(
    __dirname, '..', '..', '..', 'product-data', 'reports',
    'Product_Image_Status_2026-09-23.xlsx',
  );
  writeReport(after, changedIds, reportPath);

  console.log('\nApplied and verified ' + operations.length + ' visibility changes.');
  console.log('Modified products: ' + result.modifiedCount);
  console.log('All ' + after.length + ' products remain in Admin/database.');
  console.log('Backup: ' + backupPath);
  console.log('Excel report: ' + reportPath);
}

main()
  .catch(function (error) {
    console.error('ERROR: ' + error.message);
    process.exitCode = 1;
  })
  .finally(async function () {
    await mongoose.disconnect();
  });
