/**
 * Upload local public/assets carousel & banner images to Cloudinary
 * and write the resulting URLs into MongoDB (Slide + CategoryBanner).
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register src/database/upload-local-assets.ts
 */

import 'dotenv/config';
import path from 'path';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const MONGODB_URI = process.env.MONGODB_URI!;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

// Resolve relative to the parent project's public/assets dir.
// After the monorepo restructure, enjoyful-api/ lives INSIDE enjoyful_ecom/,
// so going up 3 levels from src/database/ lands at the storefront root.
const ASSETS_DIR = path.resolve(__dirname, '../../../public/assets');

const SlideSchema = new mongoose.Schema(
  { title: String, subtitle: String, description: String, buttonText: String, buttonLink: String,
    desktopImageUrl: String, mobileImageUrl: String, order: Number, isActive: Boolean },
  { strict: false, timestamps: true }
);
const CategoryBannerSchema = new mongoose.Schema(
  { category: String, desktopImageUrl: String, mobileImageUrl: String },
  { strict: false, timestamps: true }
);

// ── What to upload ─────────────────────────────────────────────────────────
// Carousel mapping: (slide title) → { desktop, mobile } local filenames
const CAROUSEL_MAP: Array<{
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  desktopFile: string;
  mobileFile: string;
  order: number;
}> = [
  {
    title: 'Pure Joy, Pure Glow',
    subtitle: 'Premium Skincare',
    description: 'Discover our curated collection of premium skincare products crafted for radiant skin.',
    buttonText: 'Shop Glow',
    buttonLink: '/category/glow',
    desktopFile: 'caro1.jpeg',
    mobileFile: 'mobile_hero_coffee.webp',
    order: 0,
  },
  {
    title: 'Gentle Care for Little Ones',
    subtitle: 'Baby Collection',
    description: 'Safe, gentle, and nourishing products specially formulated for delicate baby skin.',
    buttonText: 'Shop Baby',
    buttonLink: '/category/baby',
    desktopFile: 'carosal2.png',
    mobileFile: 'mobile_hero_baby.webp',
    order: 1,
  },
  {
    title: 'Your Daily Ritual',
    subtitle: 'Daily Essentials',
    description: 'Elevate your everyday routine with our luxurious daily care essentials.',
    buttonText: 'Shop Daily',
    buttonLink: '/category/daily',
    desktopFile: 'carosil3.png',
    mobileFile: 'perfume-for-mobile.webp',
    order: 2,
  },
];

// Category banner mapping
const BANNER_MAP: Array<{ category: 'Glow' | 'Baby' | 'Daily' | 'Home'; desktopFile: string; mobileFile: string }> = [
  { category: 'Glow', desktopFile: 'glow-banner.jpeg', mobileFile: 'glow-banner.webp' },
  { category: 'Baby', desktopFile: 'baby-banner.png', mobileFile: 'baby-banner.webp' },
  { category: 'Daily', desktopFile: 'carosal4.jpeg', mobileFile: 'carosal4.webp' },
  { category: 'Home', desktopFile: 'categoryAd.jpeg', mobileFile: 'categoryAd.webp' },
];

async function uploadLocal(filename: string, folder: string): Promise<string | null> {
  const filePath = path.join(ASSETS_DIR, filename);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1600, crop: 'limit' }],
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`  ⚠️  upload failed for ${filename}: ${(err as Error).message}`);
    return null;
  }
}

async function run() {
  console.log(`🔌 Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected. Uploading to cloud: ${CLOUD_NAME}`);
  console.log(`   Reading local assets from: ${ASSETS_DIR}\n`);

  const Slide = mongoose.model('Slide', SlideSchema);
  const CategoryBanner = mongoose.model('CategoryBanner', CategoryBannerSchema);

  // ── Carousel ─────────────────────────────────────────────────────
  console.log(`🎠 Uploading ${CAROUSEL_MAP.length} carousel slides...`);
  for (const slide of CAROUSEL_MAP) {
    console.log(`→ ${slide.title}`);
    const desktopUrl = await uploadLocal(slide.desktopFile, 'enjoyful/carousel');
    const mobileUrl = await uploadLocal(slide.mobileFile, 'enjoyful/carousel');
    if (!desktopUrl || !mobileUrl) {
      console.log(`   ⚠️  skipping slide "${slide.title}" — missing image(s)`);
      continue;
    }
    console.log(`   ✓ desktop: ${desktopUrl}`);
    console.log(`   ✓ mobile:  ${mobileUrl}`);
    await Slide.updateOne(
      { title: slide.title },
      {
        $set: {
          subtitle: slide.subtitle,
          description: slide.description,
          buttonText: slide.buttonText,
          buttonLink: slide.buttonLink,
          desktopImageUrl: desktopUrl,
          mobileImageUrl: mobileUrl,
          order: slide.order,
          isActive: true,
        },
        $setOnInsert: { title: slide.title },
      },
      { upsert: true }
    );
  }

  // ── Category banners ────────────────────────────────────────────
  console.log(`\n🏷️  Uploading ${BANNER_MAP.length} category banners...`);
  for (const banner of BANNER_MAP) {
    console.log(`→ ${banner.category}`);
    const desktopUrl = await uploadLocal(banner.desktopFile, `enjoyful/category-banners/${banner.category}`);
    const mobileUrl = await uploadLocal(banner.mobileFile, `enjoyful/category-banners/${banner.category}`);
    if (!desktopUrl && !mobileUrl) {
      console.log(`   ⚠️  no images uploaded for ${banner.category}`);
      continue;
    }
    console.log(`   ✓ desktop: ${desktopUrl || '(none)'}`);
    console.log(`   ✓ mobile:  ${mobileUrl || '(none)'}`);
    await CategoryBanner.updateOne(
      { category: banner.category },
      { $set: { desktopImageUrl: desktopUrl || '', mobileImageUrl: mobileUrl || '' } },
      { upsert: true }
    );
  }

  console.log(`\n🎉 Local assets uploaded.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
