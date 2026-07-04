'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminApi } from '@/lib/admin-api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  productType: z.string().optional(),
  price: z.string().regex(/^\d*\.?\d*$/, 'Must be a number').min(1, 'Required'),
  compareAtPrice: z.string().regex(/^\d*\.?\d*$/, 'Must be a number').optional(),
  currency: z.enum(['AED', 'GBP']),
  description: z.string().optional(),
  stock: z.string().regex(/^\d*$/, 'Must be a whole number'),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  onSale: z.boolean(),
  bestDeal: z.boolean(),
  image: z.string().optional(),
  hoverImage: z.string().optional(),
  benefits: z.string().optional(),
  ingredients: z.string().optional(),
  skinType: z.string().optional(),
  tags: z.string().optional(),
  howToUse: z.string().optional(),
  // Rich catalog fields
  productCode: z.string().optional(),
  size: z.string().optional(),
  itemForm: z.string().optional(),
  shortDescription: z.string().optional(),
  activeIngredients: z.string().optional(),
  features: z.string().optional(),
  targetUse: z.string().optional(),
  hairType: z.string().optional(),
  scent: z.string().optional(),
  texture: z.string().optional(),
  recommendedUsage: z.string().optional(),
  precautions: z.string().optional(),
  seoTitle: z.string().max(60, 'Max 60 characters').optional(),
  metaDescription: z.string().max(160, 'Max 160 characters').optional(),
  keywords: z.string().optional(),
  searchTags: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  barcode: z.string().optional(),
  shelfLife: z.string().optional(),
  storageInstructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Category { _id: string; name: string; }

export interface ProductFormDefaults {
  name?: string;
  category?: string;
  subcategory?: string;
  productType?: string;
  price?: string | number;
  compareAtPrice?: string | number;
  currency?: 'AED' | 'GBP';
  description?: string;
  stock?: string | number;
  isFeatured?: boolean;
  isActive?: boolean;
  onSale?: boolean;
  bestDeal?: boolean;
  image?: string;
  hoverImage?: string;
  benefits?: string;
  ingredients?: string;
  skinType?: string;
  tags?: string;
  productCode?: string;
  size?: string;
  itemForm?: string;
  shortDescription?: string;
  activeIngredients?: string;
  features?: string;
  targetUse?: string;
  hairType?: string;
  scent?: string;
  texture?: string;
  recommendedUsage?: string;
  precautions?: string;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string;
  searchTags?: string;
  countryOfOrigin?: string;
  barcode?: string;
  shelfLife?: string;
  storageInstructions?: string;
}

interface Props {
  defaultValues?: ProductFormDefaults;
  productId?: string;
  categories: Category[];
}

function splitList(val: string | undefined): string[] {
  return val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function Section({ id, title, activeSection, onToggle, children }: { id: string; title: string; activeSection: string | null; onToggle: (id: string) => void; children: React.ReactNode }) {
  const open = activeSection === id;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

export function ProductForm({ defaultValues, productId, categories }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>('basic');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'AED' as const,
      isFeatured: false,
      isActive: true,
      onSale: false,
      bestDeal: false,
      ...defaultValues,
      price: defaultValues?.price != null ? String(defaultValues.price) : '',
      compareAtPrice: defaultValues?.compareAtPrice != null ? String(defaultValues.compareAtPrice) : '',
      stock: defaultValues?.stock != null ? String(defaultValues.stock) : '0',
    },
  });

  const seoTitle = watch('seoTitle') ?? '';
  const metaDescription = watch('metaDescription') ?? '';

  async function onSubmit(data: FormData) {
    setError('');
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : undefined,
        stock: parseInt(data.stock, 10) || 0,
        benefits: splitList(data.benefits),
        ingredients: splitList(data.ingredients),
        skinType: splitList(data.skinType),
        tags: splitList(data.tags),
        activeIngredients: splitList(data.activeIngredients),
        features: splitList(data.features),
        hairType: splitList(data.hairType),
        keywords: splitList(data.keywords),
        searchTags: splitList(data.searchTags),
      };
      if (productId) {
        await adminApi.updateProduct(productId, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      router.push('/admin/products');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';
  const textareaClass = `${inputClass} resize-none`;

  const toggleSection = (id: string) => setActiveSection(prev => prev === id ? null : id);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          {error}
        </p>
      )}

      {/* ── Basic Info ───────────────────────────────────────────── */}
      <Section id="basic" title="Basic Information" activeSection={activeSection} onToggle={toggleSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input type="text" {...register('name')} className={inputClass} />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select {...register('category')} className={inputClass}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <input type="text" {...register('subcategory')} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
            <input type="text" {...register('productType')} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
            <input type="text" {...register('productCode')} placeholder="e.g. JALL100" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <input type="text" {...register('size')} placeholder="e.g. 100ml, 350gm" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Form</label>
            <input type="text" {...register('itemForm')} placeholder="e.g. Lotion, Cream, Gel, Spray" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select {...register('currency')} className={inputClass}>
              <option value="AED">AED</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input type="number" step="0.01" min="0" {...register('price')} className={inputClass} />
            {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare At Price</label>
            <input type="number" step="0.01" min="0" {...register('compareAtPrice')} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input type="number" min="0" {...register('stock')} className={inputClass} />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isFeatured')} className="rounded" />
            <span className="font-medium text-gray-700">Featured (Bestseller)</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('onSale')} className="rounded" />
            <span className="font-medium text-gray-700">On Sale</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('bestDeal')} className="rounded" />
            <span className="font-medium text-gray-700">Best Deal</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="rounded" />
            <span className="font-medium text-gray-700">Active</span>
          </label>
        </div>
      </Section>

      {/* ── Descriptions ─────────────────────────────────────────── */}
      <Section id="descriptions" title="Descriptions" activeSection={activeSection} onToggle={toggleSection}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Description{' '}
            <span className="text-gray-400 font-normal">(50–80 words, shown on product cards)</span>
          </label>
          <textarea {...register('shortDescription')} rows={3} className={textareaClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Description{' '}
            <span className="text-gray-400 font-normal">(100–200 words)</span>
          </label>
          <textarea {...register('description')} rows={5} className={textareaClass} />
        </div>
      </Section>

      {/* ── Product Details ───────────────────────────────────────── */}
      <Section id="details" title="Product Details" activeSection={activeSection} onToggle={toggleSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Use
            </label>
            <input type="text" {...register('targetUse')} placeholder="Face / Body / Hair / Baby Care" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scent</label>
            <input type="text" {...register('scent')} placeholder="Floral / Fresh / Citrus / Unscented" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texture</label>
            <input type="text" {...register('texture')} placeholder="Creamy / Lightweight / Gel-Based" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skin Types{' '}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input type="text" {...register('skinType')} placeholder="Dry Skin, Oily Skin, All Skin Types" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hair Types{' '}
              <span className="text-gray-400 font-normal">(comma-separated, hair products only)</span>
            </label>
            <input type="text" {...register('hairType')} placeholder="Dry Hair, Damaged Hair" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features{' '}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input type="text" {...register('features')} placeholder="Vegan, Cruelty-free, Dermatologist tested" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits{' '}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input type="text" {...register('benefits')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags{' '}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input type="text" {...register('tags')} className={inputClass} />
          </div>
        </div>
      </Section>

      {/* ── Ingredients ───────────────────────────────────────────── */}
      <Section id="ingredients" title="Ingredients" activeSection={activeSection} onToggle={toggleSection}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Active Ingredients{' '}
            <span className="text-gray-400 font-normal">(comma-separated key actives)</span>
          </label>
          <input type="text" {...register('activeIngredients')} placeholder="Aloe Vera, Glycerin, Vitamin C" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full INCI Ingredients{' '}
            <span className="text-gray-400 font-normal">(comma-separated, exactly as supplied)</span>
          </label>
          <textarea {...register('ingredients')} rows={4} className={textareaClass} placeholder="Aqua, Glycerin, Sodium Laureth Sulfate…" />
        </div>
      </Section>

      {/* ── Usage ─────────────────────────────────────────────────── */}
      <Section id="usage" title="Usage Information" activeSection={activeSection} onToggle={toggleSection}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How To Use</label>
          <textarea {...register('howToUse')} rows={3} className={textareaClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recommended Usage{' '}
            <span className="text-gray-400 font-normal">(frequency)</span>
          </label>
          <input type="text" {...register('recommendedUsage')} placeholder="Twice daily, morning and evening." className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precautions</label>
          <textarea {...register('precautions')} rows={2} className={textareaClass} placeholder="Avoid contact with eyes. Keep out of reach of children." />
        </div>
      </Section>

      {/* ── SEO ───────────────────────────────────────────────────── */}
      <Section id="seo" title="SEO" activeSection={activeSection} onToggle={toggleSection}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SEO Title{' '}
            <span className={`text-xs font-normal ${seoTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
              {seoTitle.length}/60
            </span>
          </label>
          <input type="text" {...register('seoTitle')} className={inputClass} placeholder="Product Name | Category | Enjoyful Life" />
          {errors.seoTitle && <p className="text-red-600 text-xs mt-1">{errors.seoTitle.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description{' '}
            <span className={`text-xs font-normal ${metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
              {metaDescription.length}/160
            </span>
          </label>
          <textarea {...register('metaDescription')} rows={2} className={textareaClass} placeholder="One or two sentences describing the product for search engines." />
          {errors.metaDescription && <p className="text-red-600 text-xs mt-1">{errors.metaDescription.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords{' '}
              <span className="text-gray-400 font-normal">(comma-separated, 5–10)</span>
            </label>
            <input type="text" {...register('keywords')} placeholder="face wash UAE, vitamin c cleanser" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Tags{' '}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input type="text" {...register('searchTags')} placeholder="face wash, cleanser, glow" className={inputClass} />
          </div>
        </div>
      </Section>

      {/* ── Compliance ────────────────────────────────────────────── */}
      <Section id="compliance" title="Compliance & Logistics" activeSection={activeSection} onToggle={toggleSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <input type="text" {...register('barcode')} placeholder="Pending Client Confirmation" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
            <input type="text" {...register('countryOfOrigin')} placeholder="Pending Client Confirmation" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life</label>
            <input type="text" {...register('shelfLife')} placeholder="Pending Client Confirmation" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Instructions</label>
            <input type="text" {...register('storageInstructions')} placeholder="Store in a cool, dry place." className={inputClass} />
          </div>
        </div>
      </Section>

      {/* ── Images ────────────────────────────────────────────────── */}
      <Section id="images" title="Images" activeSection={activeSection} onToggle={toggleSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image URL</label>
            <input type="text" {...register('image')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hover Image URL</label>
            <input type="text" {...register('hoverImage')} className={inputClass} />
          </div>
        </div>
      </Section>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving…' : productId ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
