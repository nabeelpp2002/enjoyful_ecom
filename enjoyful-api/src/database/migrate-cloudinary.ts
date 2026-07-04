/**
 * Migrate images from the old Cloudinary account to the new one.
 *
 * What it does:
 *   1. Connects to MongoDB + configures Cloudinary from .env
 *   2. For every product: re-uploads each image URL (Cloudinary fetches the remote URL),
 *      replaces images[], image, hoverImage with the new dk9mwcx68 URLs
 *   3. For every carousel slide: re-uploads desktopImageUrl + mobileImageUrl (skips if blank)
 *   4. For every category banner: re-uploads desktopImageUrl + mobileImageUrl (skips if blank)
 *
 * Idempotent: if a URL already points at the NEW cloud, it's left alone.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register src/database/migrate-cloudinary.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const MONGODB_URI = process.env.MONGODB_URI!;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

const ProductImageSchema = new mongoose.Schema(
  { url: String, publicId: String, alt: String, isPrimary: Boolean },
  { _id: false }
);
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    images: [ProductImageSchema],
    image: String,
    hoverImage: String,
  },
  { strict: false, timestamps: true }
);
const SlideSchema = new mongoose.Schema(
  { title: String, desktopImageUrl: String, mobileImageUrl: String, imageUrl: String },
  { strict: false, timestamps: true }
);
const CategoryBannerSchema = new mongoose.Schema(
  { category: String, desktopImageUrl: String, mobileImageUrl: String },
  { strict: false, timestamps: true }
);

const NEW_CLOUD_PREFIX = `https://res.cloudinary.com/${CLOUD_NAME}/`;

async function reupload(url: string, folder: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith(NEW_CLOUD_PREFIX)) {
    return url; // already on the new account
  }
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder,
      transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1200, crop: 'limit' }],
    });
    return result.secure_url;
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    console.warn(`  ⚠️  re-upload failed for ${url}: ${msg}`);
    return null;
  }
}

async function migrate() {
  console.log(`🔌 Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected. Migrating to Cloudinary cloud: ${CLOUD_NAME}`);

  const Product = mongoose.model('Product', ProductSchema);
  const Slide = mongoose.model('Slide', SlideSchema);
  const CategoryBanner = mongoose.model('CategoryBanner', CategoryBannerSchema);

  // ── Products ─────────────────────────────────────────────────────
  const products = await Product.find().lean();
  console.log(`\n📦 Found ${products.length} products`);

  let pUpdated = 0;
  for (const p of products) {
    console.log(`\n→ ${p.name}`);
    const newImages: Array<{ url: string; alt?: string; isPrimary?: boolean }> = [];
    const oldImages = (p as { images?: Array<{ url: string; alt?: string; isPrimary?: boolean }> }).images ?? [];
    for (let i = 0; i < oldImages.length; i++) {
      const img = oldImages[i];
      const newUrl = await reupload(img.url, `enjoyful/products/${p.slug}`);
      if (newUrl) {
        newImages.push({ url: newUrl, alt: img.alt ?? (p.name ?? ''), isPrimary: i === 0 });
        console.log(`   ✓ image ${i + 1}: ${newUrl}`);
      }
    }
    const oldImage = (p as { image?: string | null }).image ?? '';
    const newImage: string = newImages[0]?.url ?? oldImage ?? '';
    const newHover: string = newImages[1]?.url ?? newImage;
    await Product.updateOne(
      { _id: p._id },
      { $set: { images: newImages, image: newImage, hoverImage: newHover } }
    );
    pUpdated++;
  }
  console.log(`\n✅ Products updated: ${pUpdated}`);

  // ── Carousel slides ─────────────────────────────────────────────
  const slides = await Slide.find().lean();
  console.log(`\n🎠 Found ${slides.length} carousel slides`);
  for (const s of slides) {
    const sObj = s as { title?: string; desktopImageUrl?: string; mobileImageUrl?: string; imageUrl?: string };
    console.log(`→ ${sObj.title ?? '(untitled)'}`);
    const newDesktop = sObj.desktopImageUrl
      ? await reupload(sObj.desktopImageUrl, 'enjoyful/carousel')
      : '';
    const newMobile = sObj.mobileImageUrl
      ? await reupload(sObj.mobileImageUrl, 'enjoyful/carousel')
      : '';
    await Slide.updateOne(
      { _id: s._id },
      { $set: { desktopImageUrl: newDesktop ?? '', mobileImageUrl: newMobile ?? '' } }
    );
    console.log(`   ✓ desktop: ${newDesktop || '(empty)'}\n   ✓ mobile: ${newMobile || '(empty)'}`);
  }

  // ── Category banners ────────────────────────────────────────────
  const banners = await CategoryBanner.find().lean();
  console.log(`\n🏷️  Found ${banners.length} category banners`);
  for (const b of banners) {
    const bObj = b as { category?: string; desktopImageUrl?: string; mobileImageUrl?: string };
    console.log(`→ ${bObj.category}`);
    const newDesktop = bObj.desktopImageUrl
      ? await reupload(bObj.desktopImageUrl, `enjoyful/category-banners/${bObj.category}`)
      : '';
    const newMobile = bObj.mobileImageUrl
      ? await reupload(bObj.mobileImageUrl, `enjoyful/category-banners/${bObj.category}`)
      : '';
    await CategoryBanner.updateOne(
      { _id: b._id },
      { $set: { desktopImageUrl: newDesktop ?? '', mobileImageUrl: newMobile ?? '' } }
    );
  }

  console.log(`\n🎉 Migration complete!`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
