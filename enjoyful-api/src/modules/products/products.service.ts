import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { Product, ProductDocument } from './schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // Lists products with one card per product family (size variants collapsed to
  // the lowest-price representative). Products without a productFamily appear
  // individually. Uses an aggregation so pagination counts groups, not SKUs.
  async findAll(query: ProductQueryDto) {
    const { page, limit, category, q, minPrice, maxPrice, skinType, productType, subcategory, isFeatured, sort } = query;

    // ── 1. $match — same semantics as the old find() filter ──────────────────
    const match: Record<string, unknown> = { deletedAt: null, isActive: true, isHidden: { $ne: true } };

    if (category && category.toLowerCase() !== 'all') {
      const cat = await this.categoryModel.findOne({ slug: category.toLowerCase() }).lean();
      // Unresolved slug → force an empty page rather than returning everything
      match.category = cat ? cat._id : new Types.ObjectId();
    }
    // Exact (case-insensitive) subcategory match — value comes from the nav menu
    if (subcategory) match.subcategory = new RegExp(`^${this.escapeRegex(subcategory.trim())}$`, 'i');
    if (minPrice !== undefined) match.price = { ...(match.price as object), $gte: minPrice };
    if (maxPrice !== undefined) match.price = { ...(match.price as object), $lte: maxPrice };
    if (skinType) {
      const list = skinType.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length) match.skinType = { $in: list };
    }
    if (productType) {
      const list = productType.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length) match.productType = { $in: list };
    }
    if (isFeatured !== undefined) match.isFeatured = isFeatured;
    // Regex-only text search (avoids the "$text must be first stage" constraint)
    if (q) {
      const rx = new RegExp(this.escapeRegex(q), 'i');
      match.$or = [{ name: rx }, { description: rx }];
    }

    // ── 2. Final sort applied to representatives (after grouping) ────────────
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1, _id: 1 },
      price_desc: { price: -1, _id: -1 },
      rating: { rating: -1, _id: -1 },
      newest: { createdAt: -1, _id: -1 },
      featured: { isFeatured: -1, createdAt: -1, _id: -1 },
    };
    const finalSort = sortMap[sort ?? 'featured'] ?? { isFeatured: -1, createdAt: -1, _id: -1 };

    const skip = (page - 1) * limit;
    const categoryCollection = this.categoryModel.collection.name;

    // ── 3. Aggregation: collapse families to the cheapest variant ────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: match },
      // Cheapest variant first within each family so $first = the representative
      { $sort: { price: 1, _id: 1 } },
      {
        $group: {
          // Real family slug groups variants; null/'' (or missing) stay un-collapsed
          // by falling back to the unique _id.
          _id: {
            $cond: [
              { $in: [{ $ifNull: ['$productFamily', null] }, [null, '']] },
              '$_id',
              '$productFamily',
            ],
          },
          doc: { $first: '$$ROOT' },
          variantCount: { $sum: 1 },
          // Promo flags are per-variant, but the listing shows ONE card per family.
          // Surface a badge if ANY size in the family carries it (and the highest discount).
          anyFeatured: { $max: { $cond: ['$isFeatured', 1, 0] } },
          anyOnSale: { $max: { $cond: ['$onSale', 1, 0] } },
          anyBestDeal: { $max: { $cond: ['$bestDeal', 1, 0] } },
          maxDiscount: { $max: { $ifNull: ['$discountPct', 0] } },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$doc',
              {
                variantCount: '$variantCount',
                isFeatured: { $gt: ['$anyFeatured', 0] },
                onSale: { $gt: ['$anyOnSale', 0] },
                bestDeal: { $gt: ['$anyBestDeal', 0] },
                discountPct: '$maxDiscount',
              },
            ],
          },
        },
      },
      { $sort: finalSort },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: categoryCollection,
                localField: 'category',
                foreignField: '_id',
                as: 'category',
              },
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: 1, slug: 1, price: 1, originalPrice: 1, discountPct: 1,
                image: 1, hoverImage: 1, images: 1,
                subcategory: 1, productType: 1, rating: 1, reviews: 1,
                skinType: 1, size: 1, productCode: 1, productFamily: 1, variantCount: 1,
                currency: 1, isFeatured: 1, onSale: 1, bestDeal: 1, brand: 1, tagline: 1,
                externalBuyLinks: 1, description: 1, createdAt: 1,
                category: {
                  $cond: [
                    { $ifNull: ['$category', false] },
                    {
                      _id: '$category._id',
                      name: '$category.name',
                      slug: '$category.slug',
                      tintColor: '$category.tintColor',
                    },
                    null,
                  ],
                },
              },
            },
          ],
          totalCount: [{ $count: 'value' }],
        },
      },
    ];

    const [result] = await this.productModel.aggregate(pipeline);
    const data = result?.data ?? [];
    const total = result?.totalCount?.[0]?.value ?? 0;

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Product not found');
    const product = await this.productModel
      .findOne({ _id: id, deletedAt: null })
      .populate('category', 'name slug tintColor')
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug, deletedAt: null })
      .populate('category', 'name slug tintColor')
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = await this.generateSlug(dto.name);
    const categoryId = await this.resolveCategoryId(dto.category);
    const { images, ...rest } = dto;
    const productImages = this.normalizeImages(images);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.productModel.create({ ...rest, slug, category: categoryId, images: productImages } as any);
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    const { images, ...rest } = dto;
    const update: Record<string, unknown> = { ...rest };
    if (dto.name) update.slug = await this.generateSlug(dto.name, id);
    if (dto.category) update.category = await this.resolveCategoryId(dto.category);
    if (images !== undefined) update.images = this.normalizeImages(images);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await this.productModel
      .findByIdAndUpdate(id, update as any, { new: true })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findAllAdmin() {
    // Project only the fields the admin list + group view need. Excludes the heavy
    // INCI/SEO/usage arrays (ingredients, activeIngredients, keywords, searchTags,
    // features, howToUse, precautions, etc.) which the single-product edit fetch
    // loads separately. Cuts the list payload by a large margin at 100+ products.
    return this.productModel
      .find({ deletedAt: null })
      .select(
        'name slug category subcategory productType tagline brand size productCode skuCode variant unitType mockupStatus ' +
          'productFamily price originalPrice discountPct currency description rating reviews ' +
          'benefits image images isHidden isActive isFeatured onSale bestDeal externalBuyLinks createdAt',
      )
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
  }

  async quickSearch(query: string, limit = 8) {
    const q = query?.trim();
    if (!q) return [];
    const regex = new RegExp(this.escapeRegex(q), 'i');
    // Over-fetch and sort cheapest-first so the first hit per family is the
    // representative, then dedupe by family so both sizes don't both appear.
    const rows = await this.productModel
      .find({
        deletedAt: null,
        isActive: true,
        isHidden: { $ne: true },
        $or: [{ name: regex }, { tagline: regex }, { subcategory: regex }],
      })
      .select('name slug price originalPrice discountPct image images category subcategory productFamily')
      .populate('category', 'name slug')
      .sort({ price: 1, name: 1 })
      .limit(limit * 2)
      .lean();

    const seen = new Set<string>();
    const deduped: typeof rows = [];
    for (const r of rows) {
      const fam = ((r as { productFamily?: string }).productFamily ?? '').trim();
      const key = fam ? `fam:${fam}` : `id:${String(r._id)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
      if (deduped.length >= limit) break;
    }
    return deduped;
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async updateVisibility(id: string, isHidden: boolean) {
    const product = await this.productModel
      .findByIdAndUpdate(id, { isHidden }, { new: true })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private normalizeImages(images?: string[]): Array<{ url: string; publicId: string; alt: string; isPrimary: boolean }> {
    if (!images?.length) return [];
    return images.map((url, i) => ({ url, publicId: '', alt: '', isPrimary: i === 0 }));
  }

  async softDelete(id: string) {
    const product = await this.productModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    return { deleted: true };
  }

  async bulkImportJson(records: CreateProductDto[]) {
    const results = { created: 0, failed: 0, errors: [] as { index: number; message: string }[] };
    for (let i = 0; i < records.length; i++) {
      try {
        const dto = records[i];
        const slug = await this.generateSlug(dto.name);
        const exists = await this.productModel.findOne({ slug }).lean();
        if (exists) { results.failed++; results.errors.push({ index: i + 1, message: `Slug '${slug}' already exists` }); continue; }
        const categoryId = await this.resolveCategoryId(dto.category);
        const { images: dtoImgs, ...dtoRest } = dto;
        const productImages = this.normalizeImages(dtoImgs);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.productModel.create({ ...dtoRest, slug, category: categoryId, images: productImages } as any);
        results.created++;
      } catch (err) {
        results.failed++;
        results.errors.push({ index: i + 1, message: (err as Error).message });
      }
    }
    return results;
  }

  // Returns all active size variants that share the same productFamily slug.
  // Used by the product-page size selector.
  async findFamily(family: string) {
    return this.productModel
      .find({ productFamily: family, deletedAt: null, isActive: true, isHidden: { $ne: true } })
      .select('name slug size price compareAtPrice originalPrice discountPct stock productCode currency')
      .sort({ price: 1 })
      .lean();
  }

  // ── XLSX catalog import ────────────────────────────────────────────────────
  // Parses the Enjoyful Life catalog spreadsheet (columns: Code | Item Name | Ingredients | Benefits)
  // and returns raw CreateProductDto objects with no price set (price = 0 as placeholder).
  // The returned array is suitable for review in the admin UI before calling bulkImportJson.
  parseXlsxBuffer(buffer: Buffer): { parsed: Partial<CreateProductDto>[]; errors: string[] } {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

    const parsed: Partial<CreateProductDto>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Support both exact header spellings used in the Enjoyful Life spreadsheet
      const code = (row['Code'] || row['code'] || '').trim();
      const itemName = (row['Item Name'] || row['item name'] || row['name'] || '').trim();
      const ingredientsRaw = (row['Ingredients '] || row['Ingredients'] || row['ingredients'] || '').trim();
      const benefitsRaw = (row['benifits'] || row['benefits'] || row['Benefits'] || '').trim();

      if (!itemName) { errors.push(`Row ${i + 2}: missing Item Name — skipped`); continue; }

      // Extract size from item name: match patterns like "100ml", "350ml", "75gm", "400gm"
      const sizeMatch = itemName.match(/(\d+\s*(?:ml|gm|g|l|kg))/i);
      const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '';

      // Strip " (N)" pack quantity suffix and brand prefix to get a clean name
      const cleanName = itemName
        .replace(/^Enjoyful Life\s*/i, '')
        .replace(/\s*\(\d+\)\s*$/, '')
        .trim();

      // Derive category + subcategory from product name heuristics
      const { category, subcategory, productType, targetUse, itemForm, scent, texture } =
        this.inferCatalogFields(cleanName);

      // Parse bullet-point benefits into array
      const benefits = benefitsRaw
        .split('\n')
        .map((b) => b.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);

      // Preserve ingredients exactly as supplied; extract active ingredients
      const ingredientsList = ingredientsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const activeIngredients = this.extractActiveIngredients(ingredientsList);

      // Build slug from clean name
      const slug = slugify(`enjoyful-life-${cleanName}`, { lower: true, strict: true });

      parsed.push({
        productCode: code,
        name: `Enjoyful Life ${cleanName}`,
        brand: 'Enjoyful Life',
        category,
        subcategory,
        productType,
        size,
        itemForm,
        targetUse,
        scent,
        texture,
        slug,
        price: 0,          // price must be set by admin before import
        currency: 'AED',
        benefits,
        ingredients: ingredientsList,
        activeIngredients,
        barcode: 'Pending Client Confirmation',
        shelfLife: 'Pending Client Confirmation',
        storageInstructions: 'Pending Client Confirmation',
        countryOfOrigin: 'Pending Client Confirmation',
        images: [],
        isActive: true,
        stock: 0,
      });
    }

    return { parsed, errors };
  }

  // Infer category/subcategory/productType from the clean product name
  private inferCatalogFields(name: string): {
    category: string;
    subcategory: string;
    productType: string;
    targetUse: string;
    itemForm: string;
    scent: string;
    texture: string;
  } {
    const n = name.toLowerCase();

    if (n.includes('perfume') || n.includes('fragrance') || n.includes('eau de')) {
      return { category: 'Fragrances', subcategory: 'Perfume', productType: 'Perfume', targetUse: 'Body', itemForm: 'Spray', scent: 'Floral', texture: '' };
    }
    if (n.includes('body mist')) {
      return { category: 'Fragrances', subcategory: 'Body Mist', productType: 'Body Mist', targetUse: 'Body', itemForm: 'Spray', scent: 'Fresh', texture: 'Lightweight' };
    }
    if (n.includes('roll on')) {
      return { category: 'Fragrances', subcategory: 'Roll On', productType: 'Roll On', targetUse: 'Body', itemForm: 'Roll-On', scent: 'Fresh', texture: '' };
    }
    if (n.includes('deo stick') || n.includes('deodorant')) {
      return { category: 'Fragrances', subcategory: 'Deo Stick', productType: 'Deo Stick', targetUse: 'Body', itemForm: 'Stick', scent: 'Fresh', texture: '' };
    }
    if (n.includes('baby lotion')) {
      return { category: 'Baby', subcategory: 'Baby Lotion', productType: 'Baby Lotion', targetUse: 'Baby Care', itemForm: 'Lotion', scent: 'Unscented', texture: 'Creamy' };
    }
    if (n.includes('baby wash')) {
      return { category: 'Baby', subcategory: 'Baby Wash', productType: 'Baby Wash', targetUse: 'Baby Care', itemForm: 'Gel', scent: 'Unscented', texture: 'Gel-Based' };
    }
    if (n.includes('baby talc') || n.includes('baby powder')) {
      return { category: 'Baby', subcategory: 'Baby Talc', productType: 'Baby Talc', targetUse: 'Baby Care', itemForm: 'Powder', scent: 'Unscented', texture: '' };
    }
    if (n.includes('baby rash')) {
      return { category: 'Baby', subcategory: 'Baby Rash Cream', productType: 'Baby Rash Cream', targetUse: 'Baby Care', itemForm: 'Cream', scent: 'Unscented', texture: 'Creamy' };
    }
    if (n.includes('baby soap')) {
      return { category: 'Baby', subcategory: 'Baby Soap', productType: 'Baby Soap', targetUse: 'Baby Care', itemForm: 'Bar', scent: 'Unscented', texture: 'Smooth' };
    }
    if (n.includes('face wash') || n.includes('foaming face')) {
      return { category: 'Glow', subcategory: 'Face Wash', productType: 'Face Wash', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based' };
    }
    if (n.includes('face scrub') || n.includes('body scrub')) {
      const isFace = n.includes('face');
      return { category: 'Glow', subcategory: isFace ? 'Face Scrub' : 'Body Scrub', productType: 'Scrub', targetUse: isFace ? 'Face' : 'Body', itemForm: 'Scrub', scent: 'Herbal', texture: 'Smooth' };
    }
    if (n.includes('face mask') || n.includes('peel off')) {
      return { category: 'Glow', subcategory: 'Face Mask', productType: 'Peel Off Mask', targetUse: 'Face', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based' };
    }
    if (n.includes('sunscreen') || n.includes('spf')) {
      return { category: 'Glow', subcategory: 'Sunscreen', productType: 'Sunscreen Cream', targetUse: 'Face', itemForm: 'Cream', scent: 'Unscented', texture: 'Lightweight' };
    }
    if (n.includes('aloe vera gel') || n.includes('aloevera gel')) {
      return { category: 'Glow', subcategory: 'Aloe Vera Gel', productType: 'Aloe Vera Gel', targetUse: 'Face', itemForm: 'Gel', scent: 'Herbal', texture: 'Gel-Based' };
    }
    if (n.includes('rose water') || n.includes('rosewater') || n.includes('toner')) {
      return { category: 'Glow', subcategory: 'Toner', productType: 'Rose Water', targetUse: 'Face', itemForm: 'Spray', scent: 'Floral', texture: 'Lightweight' };
    }
    if (n.includes('hair serum') || n.includes('serum')) {
      return { category: 'Daily', subcategory: 'Hair Serum', productType: 'Hair Serum', targetUse: 'Hair', itemForm: 'Serum', scent: 'Fresh', texture: 'Silky' };
    }
    if (n.includes('hair oil') || n.includes('jasmin oil') || n.includes('jasmine oil')) {
      return { category: 'Daily', subcategory: 'Hair Oil', productType: 'Hair Oil', targetUse: 'Hair', itemForm: 'Oil', scent: 'Floral', texture: 'Silky' };
    }
    if (n.includes('shampoo')) {
      return { category: 'Daily', subcategory: 'Shampoo', productType: 'Shampoo', targetUse: 'Hair', itemForm: 'Liquid', scent: 'Fresh', texture: 'Creamy' };
    }
    if (n.includes('hair removal')) {
      return { category: 'Daily', subcategory: 'Skin Treatment', productType: 'Hair Removal Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy' };
    }
    if (n.includes('shower gel')) {
      return { category: 'Daily', subcategory: 'Shower Gel', productType: 'Shower Gel', targetUse: 'Body', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based' };
    }
    if (n.includes('shampoo')) {
      return { category: 'Daily', subcategory: 'Shampoo', productType: 'Shampoo', targetUse: 'Hair', itemForm: 'Liquid', scent: 'Fresh', texture: 'Creamy' };
    }
    if (n.includes('intimate wash')) {
      return { category: 'Daily', subcategory: 'Intimate Wash', productType: 'Intimate Wash', targetUse: 'Body', itemForm: 'Gel', scent: 'Fresh', texture: 'Gel-Based' };
    }
    if (n.includes('body lotion') || n.includes('lotion')) {
      return { category: 'Daily', subcategory: 'Body Lotion', productType: 'Body Lotion', targetUse: 'Body', itemForm: 'Lotion', scent: 'Fresh', texture: 'Creamy' };
    }
    if (n.includes('body cream') || n.includes('moisturising cream') || n.includes('moisturizing cream') || n.includes('nourish') || n.includes('repair')) {
      return { category: 'Daily', subcategory: 'Body Cream', productType: 'Body Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy' };
    }
    if (n.includes('daily delight')) {
      return { category: 'Daily', subcategory: 'Body Cream', productType: 'Moisturising Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy' };
    }
    // fallback
    return { category: 'Daily', subcategory: 'Body Cream', productType: 'Cream', targetUse: 'Body', itemForm: 'Cream', scent: 'Fresh', texture: 'Creamy' };
  }

  // Extract well-known active ingredients from the full ingredient list
  private extractActiveIngredients(ingredients: string[]): string[] {
    const ACTIVES = [
      'aloe', 'glycerin', 'hyaluronic', 'niacinamide', 'vitamin c', 'ascorbic',
      'vitamin e', 'tocopherol', 'zinc oxide', 'retinol', 'salicylic', 'lactic acid',
      'caffeine', 'argan', 'argania', 'coconut', 'cocos', 'jojoba', 'simmondsia',
      'rose', 'rosa', 'chamomile', 'almond', 'prunus', 'walnut', 'juglans',
      'onion', 'allium', 'bamboo', 'keratin', 'panthenol', 'biotin', 'collagen',
      'jasmine', 'jasminum', 'coffee', 'coffea', 'charcoal', 'papaya', 'carica',
      'lemon', 'citrus', 'orange', 'sodium hyaluronate', 'centella',
    ];
    return ingredients.filter((ing) => {
      const lower = ing.toLowerCase();
      return ACTIVES.some((kw) => lower.includes(kw));
    });
  }

  async bulkImportCsv(buffer: Buffer) {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const dtos: CreateProductDto[] = records.map((row) => ({
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      productType: row.productType,
      price: parseFloat(row.price),
      currency: (row.currency || 'AED') as 'AED' | 'GBP',
      description: row.description,
      benefits: row.benefits ? row.benefits.split('|').map((s) => s.trim()) : [],
      ingredients: row.ingredients ? row.ingredients.split('|').map((s) => s.trim()) : [],
      howToUse: row.howToUse,
      skinType: row.skinType ? row.skinType.split('|').map((s) => s.trim()) : [],
      stock: parseInt(row.stock ?? '0', 10),
      isFeatured: row.isFeatured === 'true',
      image: row.image,
      hoverImage: row.hoverImage,
    }));

    return this.bulkImportJson(dtos);
  }

  private async resolveCategoryId(categoryNameOrId: string): Promise<Types.ObjectId> {
    if (Types.ObjectId.isValid(categoryNameOrId)) {
      return new Types.ObjectId(categoryNameOrId);
    }
    const cat = await this.categoryModel
      .findOne({ $or: [{ name: categoryNameOrId }, { slug: categoryNameOrId.toLowerCase() }] })
      .lean();
    if (!cat) throw new NotFoundException(`Category '${categoryNameOrId}' not found`);
    return cat._id as Types.ObjectId;
  }

  private async generateSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 2;
    while (true) {
      const query = this.productModel.findOne({ slug });
      if (excludeId) query.where('_id').ne(excludeId);
      const exists = await query.lean();
      if (!exists) break;
      slug = `${base}-${counter++}`;
    }
    return slug;
  }
}
