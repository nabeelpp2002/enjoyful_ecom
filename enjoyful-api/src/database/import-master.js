/**
 * DESTRUCTIVE (MongoDB): wipe all products, drop the stray "Home" category,
 * import the clean master catalog (size-group model) with image URLs already attached.
 * Imageless products are imported HIDDEN (isHidden:true) so they surface in Admin → Missing Images.
 *   node src/database/import-master.js
 * Prereqs: cloudinary-migrate.js already ran (produces image-urls.json).
 */
'use strict';
require('dotenv/config');
const mongoose = require('mongoose');
const path = require('path');

const MASTER = path.resolve(__dirname, '..', '..', '..', 'product-data', 'master');
const skus = require(path.join(MASTER, 'master-skus.json'));
let imageUrls = {};
try { imageUrls = require(path.join(MASTER, 'image-urls.json')); } catch { console.log('⚠ image-urls.json missing — importing with NO images (all hidden).'); }

const CATEGORIES = [
  { name: 'Glow', slug: 'glow', tintColor: '#F0EDF6', sortOrder: 1 },
  { name: 'Daily', slug: 'daily', tintColor: '#FBEBE5', sortOrder: 2 },
  { name: 'Baby', slug: 'baby', tintColor: '#E6F0F9', sortOrder: 3 },
  { name: 'Fragrances', slug: 'fragrances', tintColor: '#F5EFF8', sortOrder: 4 },
  { name: 'Home Care', slug: 'home-care', tintColor: '#EAF3EB', sortOrder: 5 },
];

const ACTIVE_KW = ['aloe','glycerin','hyaluronic','niacinamide','vitamin c','ascorbic','vitamin e','tocopher','zinc oxide','retinol','salicylic','lactic acid','caffeine','argan','argania','coconut','cocos','jojoba','rose','rosa','almond','prunus','walnut','juglans','onion','allium','bamboo','keratin','panthenol','biotin','collagen','jasmin','jasminum','coffee','coffea','charcoal','papaya','carica','citrus','centella','menthol','shea','oud'];
const extractActives = ing => ing.filter(i => { const l = i.toLowerCase(); return ACTIVE_KW.some(k => l.includes(k)); });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');
  const CategoryModel = mongoose.model('Category', new mongoose.Schema({}, { strict: false, timestamps: true }), 'categories');
  const ProductModel = mongoose.model('Product', new mongoose.Schema({}, { strict: false, timestamps: true }), 'products');

  // 1. ensure categories
  const catMap = {};
  for (const c of CATEGORIES) {
    const doc = await CategoryModel.findOneAndUpdate({ slug: c.slug }, { $set: c }, { new: true, upsert: true });
    catMap[c.name] = doc._id;
  }
  console.log('Categories ensured:', Object.keys(catMap).join(', '));

  // 2. drop stray "Home" category (slug 'home' — NOT 'home-care')
  const stray = await CategoryModel.deleteOne({ slug: 'home' });
  console.log(`Stray "Home" category removed: ${stray.deletedCount}`);

  // 3. wipe products
  const del = await ProductModel.deleteMany({});
  console.log(`Deleted ${del.deletedCount} old products.`);

  // 4. import
  let created = 0, hidden = 0;
  for (const p of skus) {
    const catId = catMap[p.cat];
    if (!catId) { console.log(`  ! no category for ${p.fullName}`); continue; }
    const img = imageUrls[p.slug] || null;
    const hasImg = !!(img && img.image);
    const benefits = p.benefits || [];
    const ingredients = p.ingredients || [];
    const description = p.shortDesc || (benefits.length ? benefits.slice(0, 2).join('. ') + '.' : '');
    const searchTags = [p.sub, p.productType, p.cat, p.scent, p.baseName, p.sizeDisplay].filter(Boolean).map(s => s.toLowerCase());
    await ProductModel.create({
      name: p.baseName,
      slug: p.slug,
      description,
      shortDescription: p.shortDesc || '',
      category: catId,
      subcategory: p.sub,
      productType: p.productType,
      price: Number(p.price) || 0,
      currency: 'AED',
      productFamily: p.family,
      size: p.sizeDisplay || '',
      variant: p.sizeDisplay || '',
      scent: p.scent || '',
      brand: 'enJoyful Life',
      benefits,
      ingredients,
      activeIngredients: extractActives(ingredients),
      features: p.features || [],
      productCode: p.code || '',
      skuCode: p.code || '',
      image: hasImg ? img.image : '',
      hoverImage: hasImg && img.images[1] ? img.images[1].url : '',
      images: hasImg ? img.images.map(i => ({ url: i.url, publicId: i.publicId, isPrimary: !!i.isPrimary })) : [],
      tags: searchTags,
      searchTags,
      keywords: [p.baseName.toLowerCase(), `${p.sub.toLowerCase()} uae`, `buy ${p.productType.toLowerCase()} online`],
      seoTitle: `${p.baseName} | ${p.sub} | enJoyful Life`.slice(0, 60),
      metaDescription: (description || `${p.baseName} by enJoyful Life.`).slice(0, 160),
      rating: 0, reviews: 0, stock: 0,
      isActive: true, isFeatured: false, onSale: false, bestDeal: false,
      isHidden: !hasImg,
      deletedAt: null,
      externalBuyLinks: { amazon: { url: '', visible: true }, talabat: { url: '', visible: true }, carrefour: { url: '', visible: true } },
    });
    created++; if (!hasImg) hidden++;
  }
  console.log(`\n✅ Imported ${created} SKUs (${created - hidden} visible, ${hidden} hidden — no image).`);
  await mongoose.disconnect();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
