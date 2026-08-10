import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { invalidateProductCaches } from '@/lib/product-cache';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function getToken() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

function normalizeProduct(p: Record<string, unknown>) {
  const cat = p.category as Record<string, unknown> | string | null;
  const images = (p.images as Array<{ url: string } | string> | undefined) ?? [];
  const imageUrls = images.map(img => (typeof img === 'string' ? img : img.url)).filter(Boolean);
  return {
    id: String(p._id ?? p.id ?? ''),
    name: p.name,
    slug: p.slug,
    category: typeof cat === 'object' && cat ? String(cat.name ?? '') : String(cat ?? ''),
    subcategory: p.subcategory ?? '',
    productType: p.productType ?? '',
    tagline: p.tagline ?? '',
    brand: p.brand ?? '',
    size: p.size ?? '',
    productCode: p.productCode ?? '',
    skuCode: p.skuCode ?? '',
    variant: p.variant ?? '',
    unitType: p.unitType ?? '',
    mockupStatus: p.mockupStatus ?? '',
    productFamily: p.productFamily ?? '',
    price: p.price,
    originalPrice: p.originalPrice ?? 0,
    discountPct: p.discountPct ?? 0,
    description: p.description ?? '',
    howToUse: p.howToUse ?? '',
    rating: p.rating ?? 0,
    reviews: p.reviews ?? 0,
    benefits: p.benefits ?? [],
    ingredients: p.ingredients ?? [],
    highlights: p.highlights ?? [],
    suitableFor: p.suitableFor ?? [],
    image: p.image || imageUrls[0] || null,
    images: imageUrls,
    isHidden: p.isHidden ?? false,
    isActive: p.isActive ?? true,
    isFeatured: p.isFeatured ?? false,
    onSale: p.onSale ?? false,
    bestDeal: p.bestDeal ?? false,
    externalBuyLinks: p.externalBuyLinks ?? {},
  };
}

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const res = await fetch(`${API_BASE}/products/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }
  const wrapped = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(wrapped?.data)
    ? wrapped.data
    : Array.isArray(wrapped)
    ? wrapped
    : [];
  return NextResponse.json(raw.map(normalizeProduct));
}

export async function POST(request: NextRequest) {
  const token = await getToken();
  const payload = await request.json();
  // Strip fields not in NestJS DTO (sizes, slug handled by service)
  const { sizes: _s, ...body } = payload;
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) invalidateProductCaches();
  return NextResponse.json(data, { status: res.status });
}
