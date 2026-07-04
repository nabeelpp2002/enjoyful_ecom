import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';

const MONGODB_URI = process.env.MONGODB_URI!;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? 'admin@enjoyfullife.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? 'Admin@1234!';

// ── Schemas (inline for standalone script) ──────────────────────────────────

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  firstName: String, lastName: String,
  role: { type: String, default: 'customer' },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  tintColor: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const SlideSchema = new mongoose.Schema({
  title: String, subtitle: String, description: String,
  buttonText: { type: String, default: 'Shop Now' },
  buttonLink: { type: String, default: '/category/all' },
  desktopImageUrl: { type: String, default: '' },
  mobileImageUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CategoryBannerSchema = new mongoose.Schema({
  category: { type: String, unique: true, enum: ['Glow', 'Baby', 'Daily', 'Home', 'Fragrances'] },
  desktopImageUrl: { type: String, default: '' },
  mobileImageUrl: { type: String, default: '' },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true },
  description: String, category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategory: String, productType: String,
  price: Number, originalPrice: Number, discountPct: Number,
  currency: { type: String, default: 'AED' },
  images: [{ url: String, publicId: String, alt: String, isPrimary: Boolean }],
  image: String, hoverImage: String,
  rating: { type: Number, default: 0 }, reviews: { type: Number, default: 0 },
  benefits: [String], ingredients: [String], howToUse: String,
  skinType: [String], tags: [String], stock: { type: Number, default: 0 },
  tagline: String, brand: String,
  highlights: [String], suitableFor: [String],
  isFeatured: { type: Boolean, default: false }, isActive: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// ── Seed data ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Glow', tintColor: '#F0EDF6', sortOrder: 1 },
  { name: 'Baby', tintColor: '#E6F0F9', sortOrder: 2 },
  { name: 'Home', tintColor: '#EAF3EB', sortOrder: 3 },
  { name: 'Daily', tintColor: '#FBEBE5', sortOrder: 4 },
  { name: 'Fragrances', tintColor: '#F5EFF8', sortOrder: 5 },
];

const PRODUCTS_RAW = [
  { name: "Aloe Bliss Shower Gel", category: "Daily", subcategory: "Shower Gel", price: 49, originalPrice: 70, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/aloe-bliss-shower-gel/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/aloe-bliss-shower-gel/img-2"], rating: 4.6, reviews: 137, description: "Soothe and hydrate your skin with the natural goodness of Aloe Vera.", benefits: ["Intensely hydrates and locks in moisture","Soothes irritated or sun-exposed skin","Cleanses without stripping natural oils","Promotes a healthy natural glow"], ingredients: ["Aloe Barbadensis Leaf Extract","Aqua (Water)","Sodium Cocoyl Isethionate","Cocamidopropyl Betaine","Glycerin","Panthenol (Vitamin B5)","Citrus Limon (Lemon) Peel Oil","Phenoxyethanol"], howToUse: "Squeeze a generous amount onto a wet loofah or hands. Work into a rich lather and massage gently over your entire body. Rinse off thoroughly with warm water.", skinType: ["All Skin Types"], productType: "Shower Gel", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Amber Glow Perfume", category: "Glow", subcategory: "Perfume", price: 120, originalPrice: 150, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/amber-glow/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/amber-glow/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/amber-glow/img-3"], rating: 4.7, reviews: 154, description: "A warm, radiant fragrance that lingers all day long.", benefits: ["Lasts up to 12 hours on skin","Features a rich, warm, and inviting scent profile","Cruelty-free and vegan formula","Packaged in an elegant, recyclable glass bottle"], ingredients: ["Alcohol Denat.","Parfum (Fragrance)","Aqua (Water)","Limonene","Linalool","Coumarin","Amber Extract","Vanilla Planifolia Bean Extract"], howToUse: "Hold the bottle 5-7 inches away from your skin. Spritz onto pulse points such as your wrists, neck, and behind the ears. Let it dry naturally without rubbing.", skinType: ["All Skin Types"], productType: "Perfume", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Blossom Veil Perfume", category: "Glow", subcategory: "Perfume", price: 95, originalPrice: 120, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/blossom-veil/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/blossom-veil/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/blossom-veil/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/blossom-veil/img-4"], rating: 4.8, reviews: 171, description: "Delicate floral notes that wrap you in a veil of fresh blossoms.", benefits: ["Light and refreshing floral bouquet","Perfect for daily wear or spring/summer seasons","Non-irritating, dermatologist-tested formula","Leaves a subtle romantic trail"], ingredients: ["Alcohol Denat.","Parfum","Rosa Damascena Flower Water","Citronellol","Geraniol","Jasmine Grandiflorum Extract","White Musk"], howToUse: "Lightly mist over your body or clothes. For a longer-lasting scent, apply immediately after showering while pores are open.", skinType: ["All Skin Types"], productType: "Perfume", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Coastal Pulse Perfume", category: "Glow", subcategory: "Perfume", price: 85, originalPrice: 110, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coastal-pulse/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coastal-pulse/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coastal-pulse/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coastal-pulse/img-4"], rating: 4.9, reviews: 188, description: "Crisp and refreshing, like a cool ocean breeze on a sunny day.", benefits: ["Invigorating oceanic and citrus scent","Energizes your senses instantly","Ideal for an active lifestyle","Unisex fragrance profile"], ingredients: ["Alcohol Denat.","Aqua","Parfum","Sea Salt Extract","Citrus Aurantium Bergamia (Bergamot) Fruit Oil","Vetiver Extract","Oakmoss Resin"], howToUse: "Spray generously on your chest, neck, and wrists. Reapply throughout the day if a stronger projection is needed.", skinType: ["All Skin Types"], productType: "Perfume", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Coffee Face Scrub", category: "Glow", subcategory: "Face Scrub", price: 35, originalPrice: 50, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coffee-face-scrub/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coffee-face-scrub/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coffee-face-scrub/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/coffee-face-scrub/img-4"], rating: 4.5, reviews: 205, description: "Energize your skin with real coffee grounds for a natural glow.", benefits: ["Gently buffs away dead skin cells","Caffeine reduces facial puffiness and dark circles","Improves blood circulation for a radiant complexion","Deeply moisturizes while exfoliating"], ingredients: ["Coffea Arabica (Coffee) Seed Powder","Prunus Amygdalus Dulcis (Sweet Almond) Oil","Sucrose (Brown Sugar)","Tocopheryl Acetate (Vitamin E)","Cocos Nucifera (Coconut) Oil","Kaolin (Clay)"], howToUse: "Dampen your face with warm water. Apply a small amount of scrub and massage gently in circular motions for 1-2 minutes. Rinse thoroughly and pat dry. Use 2-3 times a week.", skinType: ["All Skin Types"], productType: "Face Scrub", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Lemon Vitamin C Face Wash", category: "Glow", subcategory: "Face Wash", price: 28, originalPrice: 40, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/lemon-face-wash-c-vit/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/lemon-face-wash-c-vit/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/lemon-face-wash-c-vit/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/lemon-face-wash-c-vit/img-4"], rating: 4.6, reviews: 222, description: "Brighten your complexion with the power of Vitamin C and Lemon.", benefits: ["Instantly brightens dull complexion","Fades dark spots and hyperpigmentation over time","Provides antioxidant protection against free radicals","Leaves skin feeling fresh and squeaky clean"], ingredients: ["Aqua","Sodium Ascorbyl Phosphate (Vitamin C)","Citrus Limon (Lemon) Fruit Extract","Glycerin","Decyl Glucoside","Niacinamide","Citric Acid"], howToUse: "Wet your face. Pump a small amount into your palms and massage onto your face avoiding the eye area. Rinse off with cool water. Follow up with sunscreen during the day.", skinType: ["All Skin Types"], productType: "Face Wash", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Midnight Velvet Perfume", category: "Glow", subcategory: "Perfume", price: 110, originalPrice: 140, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/midnight-velvet/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/midnight-velvet/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/midnight-velvet/img-3"], rating: 4.7, reviews: 239, description: "A deep, mysterious scent for those special evening moments.", benefits: ["Deep, commanding, and mysterious scent","Perfect for evening events and formal occasions","Strong sillage and projection","Rich woody base notes"], ingredients: ["Alcohol Denat.","Parfum","Aqua","Patchouli Oil","Sandalwood Extract","Black Orchid Extract","BHT"], howToUse: "Apply sparingly to the neck and wrists. Less is more with this intense concentration. Allow it to settle for 5 minutes to reveal its true heart notes.", skinType: ["All Skin Types"], productType: "Perfume", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Morning Buzz Shower Gel", category: "Daily", subcategory: "Shower Gel", price: 45, originalPrice: 65, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/morning-buzz-shower-gel/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/morning-buzz-shower-gel/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/morning-buzz-shower-gel/img-3"], rating: 4.8, reviews: 256, description: "The perfect wake-up call for your skin with citrus and caffeine.", benefits: ["Wakes up your senses with peppermint and citrus","Caffeine extract tightens and firms the skin","Washes away impurities and sweat effectively","Cooling sensation on the skin"], ingredients: ["Aqua","Sodium Laureth Sulfate (Plant-derived)","Coffea Arabica Seed Extract","Citrus Aurantium Dulcis (Orange) Oil","Mentha Piperita (Peppermint) Leaf Extract","Glycerin"], howToUse: "Apply to wet skin in the morning shower. Massage briskly over the body focusing on tired areas. Rinse with slightly cool water for an extra burst of energy.", skinType: ["All Skin Types"], productType: "Shower Gel", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Noir Element Perfume", category: "Glow", subcategory: "Perfume", price: 130, originalPrice: 160, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/noir-element/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/noir-element/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/noir-element/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/noir-element/img-4"], rating: 4.9, reviews: 273, description: "Bold and sophisticated, a true element of elegance.", benefits: ["Bold, sophisticated, and earthy","Highly unique signature scent","Blends spicy and woody notes seamlessly","Premium long-lasting absolute extracts"], ingredients: ["Alcohol Denat.","Parfum","Aqua","Cedarwood Extract","Cardamom Seed Oil","Black Pepper Extract","Tonka Bean Resin"], howToUse: "Spray directly onto your chest and pulse points. The warmth of your body will project the spicy notes throughout the day.", skinType: ["All Skin Types"], productType: "Perfume", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Orange Vitamin C Face Wash", category: "Glow", subcategory: "Face Wash", price: 30, originalPrice: 45, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/orange-face-wash-c-vit/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/orange-face-wash-c-vit/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/orange-face-wash-c-vit/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/orange-face-wash-c-vit/img-4"], rating: 4.5, reviews: 290, description: "Pure Vitamin C and orange extracts for a refreshed and clear face.", benefits: ["Clears clogged pores and prevents breakouts","Vitamin C boosts collagen production","Hyaluronic acid prevents the skin from feeling tight","Leaves a glowing, dewy finish"], ingredients: ["Aqua","Citrus Aurantium Dulcis (Orange) Peel Extract","Ascorbic Acid (Vitamin C)","Aloe Barbadensis Leaf Extract","Sodium Hyaluronate","Xanthan Gum","Salicylic Acid (0.5%)"], howToUse: "Gently massage a dime-sized amount onto a damp face using upward circular motions. Rinse thoroughly with lukewarm water. Use morning and night.", skinType: ["All Skin Types"], productType: "Face Wash", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Sunscreen SPF 50+", category: "Daily", subcategory: "Sun Care", price: 55, originalPrice: 75, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/sunscreen-50-plus/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/sunscreen-50-plus/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/sunscreen-50-plus/img-3"], rating: 4.6, reviews: 307, description: "Maximum protection against UVA/UVB rays with a lightweight finish.", benefits: ["Broad-spectrum UVA/UVB protection","No white cast or greasy residue","Reef-safe and mineral-based formula","Calms skin redness with Centella Asiatica"], ingredients: ["Aqua","Zinc Oxide (20%)","Titanium Dioxide","Caprylic/Capric Triglyceride","Niacinamide","Centella Asiatica Extract","Tocopherol (Vitamin E)"], howToUse: "Apply generously as the final step of your morning skincare routine, at least 15 minutes before sun exposure. Reapply every 2 hours if swimming or sweating.", skinType: ["All Skin Types"], productType: "Sun Care", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Vanilla Aura Perfume", category: "Glow", subcategory: "Perfume", price: 90, originalPrice: 115, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/vanilla-aura/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/vanilla-aura/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/vanilla-aura/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/vanilla-aura/img-4"], rating: 4.7, reviews: 324, description: "A sweet and comforting aura of pure vanilla bean extracts.", benefits: ["Sweet, comforting, and nostalgic fragrance","Softly blends vanilla with underlying warm musk","Not overly sweet or cloying","Comforting aroma that lifts your mood"], ingredients: ["Alcohol Denat.","Aqua","Parfum","Vanilla Planifolia Bean Extract","Musk Ketone","Almond Oil Extract","Caramel Color"], howToUse: "Mist lightly over your hair and clothes for an aura of sweetness that follows you everywhere.", skinType: ["All Skin Types"], productType: "Perfume", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
  { name: "Walnut Face Scrub", category: "Glow", subcategory: "Face Scrub", price: 38, originalPrice: 55, images: ["https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/walnut-face-scrub/img-1","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/walnut-face-scrub/img-2","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/walnut-face-scrub/img-3","https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/product-images/walnut-face-scrub/img-4"], rating: 4.8, reviews: 341, description: "Deeply exfoliating walnut shell powder for smooth and radiant skin.", benefits: ["Finely milled walnut powder prevents micro-tears","Jojoba oil nourishes deeply while scrubbing","Lactic acid provides gentle chemical exfoliation","Reveals incredibly smooth, baby-soft skin"], ingredients: ["Aqua","Juglans Regia (Walnut) Shell Powder","Cetearyl Alcohol","Glycerin","Simmondsia Chinensis (Jojoba) Seed Oil","Prunus Armeniaca (Apricot) Kernel Oil","Lactic Acid"], howToUse: "Use on a clean, damp face. Take a small scoop and massage tenderly with minimal pressure. Leave on for 1 minute for lactic acid to work, then rinse.", skinType: ["All Skin Types"], productType: "Face Scrub", suitableFor: ["Men","Women"], brand: "Enjoyfullife" },
];

// ── Main ─────────────────────────────────────────────────────────────────────

const SLIDES_RAW = [
  {
    title: 'Pure Joy, Pure Glow',
    subtitle: 'Premium Skincare',
    description: 'Discover our curated collection of premium skincare products crafted for radiant skin.',
    buttonText: 'Shop Glow',
    buttonLink: '/category/glow',
    desktopImageUrl: 'https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/carousel/desktop-1',
    mobileImageUrl: 'https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/carousel/mobile-1',
    order: 0,
    isActive: true,
  },
  {
    title: 'Gentle Care for Little Ones',
    subtitle: 'Baby Collection',
    description: 'Safe, gentle, and nourishing products specially formulated for delicate baby skin.',
    buttonText: 'Shop Baby',
    buttonLink: '/category/baby',
    desktopImageUrl: 'https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/carousel/desktop-2',
    mobileImageUrl: 'https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/carousel/mobile-2',
    order: 1,
    isActive: true,
  },
  {
    title: 'Your Daily Ritual',
    subtitle: 'Daily Essentials',
    description: 'Elevate your everyday routine with our luxurious daily care essentials.',
    buttonText: 'Shop Daily',
    buttonLink: '/category/daily',
    desktopImageUrl: 'https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/carousel/desktop-3',
    mobileImageUrl: 'https://res.cloudinary.com/djejbpz0j/image/upload/f_auto,q_auto/enjoyfull/carousel/mobile-3',
    order: 2,
    isActive: true,
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const UserModel = mongoose.model('User', UserSchema);
  const CategoryModel = mongoose.model('Category', CategorySchema);
  const ProductModel = mongoose.model('Product', ProductSchema);
  const SlideModel = mongoose.model('Slide', SlideSchema);
  const CategoryBannerModel = mongoose.model('CategoryBanner', CategoryBannerSchema);

  // 1. Admin user
  const existingAdmin = await UserModel.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await UserModel.create({
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashed,
      firstName: 'Admin',
      lastName: 'enJoyful',
      role: 'admin',
    });
    console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL}`);
  }

  // 2. Categories
  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name, { lower: true, strict: true });
    const existing = await CategoryModel.findOne({ slug });
    if (!existing) {
      const created = await CategoryModel.create({ ...cat, slug });
      categoryMap[cat.name] = created._id as mongoose.Types.ObjectId;
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      categoryMap[cat.name] = existing._id as mongoose.Types.ObjectId;
      console.log(`ℹ️  Category exists: ${cat.name}`);
    }
  }

  // 3. Products — wipe and re-seed from scratch
  await ProductModel.deleteMany({});
  console.log('🗑️  Existing products cleared');

  let created = 0;
  for (const p of PRODUCTS_RAW) {
    const slug = slugify(p.name, { lower: true, strict: true });
    const discountPct =
      p.originalPrice > p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0;
    await ProductModel.create({
      ...p,
      slug,
      category: categoryMap[p.category],
      originalPrice: p.originalPrice,
      discountPct,
      image: p.images[0],
      hoverImage: p.images[1] ?? p.images[0],
      images: p.images.map((url, i) => ({ url, isPrimary: i === 0, alt: p.name })),
      isFeatured: false,
    });
    created++;
  }
  console.log(`✅ Products: ${created} created`);

  // 4. Carousel slides — upsert by title
  let slidesCreated = 0;
  for (const slide of SLIDES_RAW) {
    const existing = await SlideModel.findOne({ title: slide.title });
    if (!existing) {
      await SlideModel.create(slide);
      slidesCreated++;
      console.log(`✅ Slide created: ${slide.title}`);
    } else {
      console.log(`ℹ️  Slide exists: ${slide.title}`);
    }
  }
  console.log(`✅ Slides: ${slidesCreated} created`);

  // 5. Category banners — upsert placeholders (use .collection to bypass Mongoose typings)
  for (const cat of ['Glow', 'Baby', 'Daily', 'Home', 'Fragrances']) {
    await CategoryBannerModel.collection.updateOne(
      { category: cat },
      { $setOnInsert: { category: cat, desktopImageUrl: '', mobileImageUrl: '' } },
      { upsert: true }
    );
  }
  console.log('✅ Category banner placeholders ready');

  console.log('🎉 Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
