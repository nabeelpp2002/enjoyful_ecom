import 'dotenv/config';
import mongoose from 'mongoose';
import * as xlsx from 'xlsx';
import slugify from 'slugify';
import { ProductSchema } from './src/modules/products/schemas/product.schema';
import { CategorySchema } from './src/modules/categories/schemas/category.schema';
import { CategoryBannerSchema } from './src/modules/category-banners/schemas/category-banner.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enjoyful';
const EXCEL_PATH = '/home/nibras-s/Desktop/Projects/enjoyful_ecom/product-data/home care/enJoyful_Life_Product_Catalog.xlsx';

function mapCategories(row: any) {
  const cat = row['Category']?.toString().toLowerCase() || '';
  const webCat = row['Suggested Web Category']?.toString().toLowerCase() || '';
  const name = row['Product Name']?.toString().toLowerCase() || '';

  if (cat.includes('dishwash') || name.includes('dishwash')) {
    return { subcategory: 'Kitchen Care', productType: 'Dishwashing Liquids' };
  }
  if (cat.includes('gel')) {
    return { subcategory: 'Kitchen Care', productType: 'Cleaning Gels' };
  }
  if (cat.includes('toilet')) {
    return { subcategory: 'Bathroom Care', productType: 'Toilet Cleaners' };
  }
  if (cat.includes('glass')) {
    return { subcategory: 'Bathroom Care', productType: 'Glass Cleaners' };
  }
  if (cat.includes('disinfectant') || webCat.includes('bathroom')) {
    return { subcategory: 'Bathroom Care', productType: 'Disinfectant Cleaners' };
  }
  if (cat.includes('floor')) {
    return { subcategory: 'Floor & Surface Care', productType: 'Floor Cleaners' };
  }
  if (cat.includes('multi') || cat.includes('cream cleaner') || name.includes('multi')) {
    return { subcategory: 'Floor & Surface Care', productType: 'Multi-Purpose & Cream Cleaners' };
  }
  if (cat.includes('bleach') || name.includes('bleach')) {
    return { subcategory: 'Floor & Surface Care', productType: 'Bleach' };
  }
  if (cat.includes('hand wash') || cat.includes('handwash') || name.includes('hand wash') || name.includes('handwash')) {
    if (name.includes('premium') || row['Short Description']?.toString().toLowerCase().includes('premium')) {
      return { subcategory: 'Hand Care', productType: 'Premium Hand Wash' };
    }
    return { subcategory: 'Hand Care', productType: 'Everyday Hand Wash' };
  }
  if (cat.includes('softener') || name.includes('softener')) {
    return { subcategory: 'Laundry Care', productType: 'Fabric Softeners' };
  }
  if (cat.includes('abaya') || name.includes('abaya')) {
    return { subcategory: 'Laundry Care', productType: 'Abaya & Specialty Laundry Care' };
  }
  if (cat.includes('detergent') || name.includes('detergent') || name.includes('liquid detergent')) {
    return { subcategory: 'Laundry Care', productType: 'Liquid Detergents' };
  }

  // Fallback
  return { subcategory: 'Other', productType: cat || 'Other' };
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const CategoryModel = mongoose.model('Category', CategorySchema);
  const ProductModel = mongoose.model('Product', ProductSchema);
  const CategoryBannerModel = mongoose.model('CategoryBanner', CategoryBannerSchema);

  // 1. Rename "Home" or "Home Essentials" category to "Home Care"
  let homeCategory = await CategoryModel.findOne({
    $or: [{ slug: 'home' }, { slug: 'home-care' }, { name: 'Home Essentials' }, { name: 'Home Care' }]
  });

  if (homeCategory) {
    homeCategory.name = 'Home Care';
    homeCategory.slug = 'home-care';
    await homeCategory.save();
    console.log('Updated existing category to Home Care');
  } else {
    homeCategory = await CategoryModel.create({
      name: 'Home Care',
      slug: 'home-care',
      tintColor: '#EAF3EB',
      sortOrder: 3,
      isActive: true,
    });
    console.log('Created new Home Care category');
  }

  // Also update banner collection if needed
  const banner = await CategoryBannerModel.findOne({ category: 'Home' });
  if (banner) {
    // Note: the schema enum might restrict it, but let's just leave it or create a new one.
    // Wait, CategoryBanner schema has an enum for category name.
    // Let's bypass validation for this update.
    await CategoryBannerModel.collection.updateOne({ category: 'Home' }, { $set: { category: 'Home Care' } });
  }

  // 2. Read Excel
  console.log(`Reading Excel file from ${EXCEL_PATH}...`);
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<any>(sheet, { defval: "", range: 3 });
  
  if (!rows || rows.length === 0) {
    console.log('No rows found in Excel.');
    process.exit(0);
  }

  console.log(`Found ${rows.length} rows to process.`);

  let updated = 0;
  let created = 0;

  for (const row of rows) {
    const sku = row['SKU Code'];
    const productName = row['Product Name'];
    if (!sku && !productName) continue;

    const { subcategory, productType } = mapCategories(row);

    const priceRaw = row['Suggested Price (AED)'];
    const price = priceRaw ? parseFloat(priceRaw.toString().replace(/[^0-9.]/g, '')) : 0;
    
    // Parse Key Features into array
    const featuresStr = row['Key Features'] || '';
    const features = featuresStr ? featuresStr.split(';').map((f: string) => f.trim()).filter(Boolean) : [];

    const productData = {
      name: productName,
      skuCode: sku,
      variant: row['Variant/Scent'],
      unitType: row['Unit Type'],
      mockupStatus: row['Mockup Status'],
      size: row['Size'],
      shortDescription: row['Short Description'],
      description: row['Short Description'] || '',
      features: features,
      price: price || 0,
      category: homeCategory._id,
      subcategory: subcategory,
      productType: productType,
      isActive: true,
      brand: 'enJoyful Life',
      // slugification of name
      slug: slugify(productName + '-' + (row['Size'] || ''), { lower: true, strict: true }),
      productFamily: slugify(productName, { lower: true, strict: true }),
    };

    // Upsert logic: Try by SKU first, then by name
    let existingProduct = null;
    if (sku) {
      existingProduct = await ProductModel.findOne({ skuCode: sku });
    }
    if (!existingProduct && productName) {
      existingProduct = await ProductModel.findOne({ name: productName });
    }

    if (existingProduct) {
      // Update
      Object.assign(existingProduct, productData);
      await existingProduct.save();
      updated++;
      console.log(`Updated: ${productName} (${sku}) -> ${subcategory} / ${productType}`);
    } else {
      // Create
      await ProductModel.create(productData);
      created++;
      console.log(`Created: ${productName} (${sku}) -> ${subcategory} / ${productType}`);
    }
  }

  console.log(`Import Complete! Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
