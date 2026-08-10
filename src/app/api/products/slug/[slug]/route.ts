import { NextRequest, NextResponse } from 'next/server';
import { fetchProductBySlugEnvelope, storefrontCacheHeaders } from '@/lib/products-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const upstream = await fetchProductBySlugEnvelope(slug);
    return NextResponse.json(upstream.body, {
      status: upstream.status,
      headers: upstream.ok ? storefrontCacheHeaders() : { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Products service unavailable' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
