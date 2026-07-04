import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';
  const limit = searchParams.get('limit') ?? '8';
  const res = await fetch(`${API_BASE}/products/quick-search?q=${encodeURIComponent(q)}&limit=${limit}`, {
    cache: 'no-store',
  });
  const wrapped = await res.json();
  const data = Array.isArray(wrapped?.data) ? wrapped.data : Array.isArray(wrapped) ? wrapped : [];
  // Normalise for the search overlay
  const items = data.map((p: Record<string, unknown>) => {
    const imgs = (p.images as Array<{ url: string } | string> | undefined) ?? [];
    const imageUrls = imgs.map(img => (typeof img === 'string' ? img : img.url)).filter(Boolean);
    const cat = p.category as Record<string, unknown> | string | null;
    return {
      id: String(p._id ?? p.id ?? ''),
      slug: p.slug,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPct: p.discountPct,
      image: p.image || imageUrls[0] || '',
      category: typeof cat === 'object' && cat ? String(cat.name ?? '') : String(cat ?? ''),
      subcategory: p.subcategory,
    };
  });
  return NextResponse.json(items);
}
