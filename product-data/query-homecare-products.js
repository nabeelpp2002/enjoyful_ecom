/**
 * Query all Home Care products from MongoDB to build the image mapping.
 * Outputs: name, skuCode, variant, size, productFamily, subcategory, images count
 */
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be set in the environment');
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('enjoyful-life');

  // First find the Home Care category ID
  const categories = await db.collection('categories').find({}).toArray();
  console.log('\n=== ALL CATEGORIES ===');
  categories.forEach(c => console.log(`  ${c.name} (${c.slug}) → _id: ${c._id}`));

  const homeCare = categories.find(c => c.name === 'Home Care' || c.slug === 'home-care');
  if (!homeCare) {
    console.log('\n❌ No "Home Care" category found!');
    await client.close();
    return;
  }

  console.log(`\n=== HOME CARE PRODUCTS (category: ${homeCare._id}) ===\n`);

  const products = await db.collection('products').find({
    category: homeCare._id,
    deletedAt: null,
  }).project({
    name: 1, skuCode: 1, variant: 1, size: 1, productFamily: 1,
    subcategory: 1, productCode: 1, image: 1, images: 1, slug: 1,
  }).sort({ subcategory: 1, name: 1 }).toArray();

  console.log(`Found ${products.length} products\n`);

  products.forEach((p, i) => {
    const imgCount = (p.images || []).length;
    const hasImage = p.image ? '✅' : '❌';
    console.log(`${String(i + 1).padStart(3)}. ${p.name}`);
    console.log(`     SKU: ${p.skuCode || p.productCode || '—'}  |  Variant: ${p.variant || '—'}  |  Size: ${p.size || '—'}`);
    console.log(`     Subcategory: ${p.subcategory || '—'}  |  Family: ${p.productFamily || '—'}`);
    console.log(`     Image: ${hasImage}  |  Images count: ${imgCount}  |  slug: ${p.slug}`);
    console.log(`     _id: ${p._id}`);
    console.log();
  });

  // Also output as JSON for scripting
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, 'homecare-products-db.json'),
    JSON.stringify(products.map(p => ({
      _id: String(p._id),
      name: p.name,
      slug: p.slug,
      skuCode: p.skuCode || '',
      productCode: p.productCode || '',
      variant: p.variant || '',
      size: p.size || '',
      subcategory: p.subcategory || '',
      productFamily: p.productFamily || '',
      hasImage: !!p.image,
      imageCount: (p.images || []).length,
    })), null, 2)
  );
  console.log('✅ Saved homecare-products-db.json');

  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
