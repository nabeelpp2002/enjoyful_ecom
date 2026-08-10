import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';
import { fetchProductListEnvelope, storefrontCacheHeaders } from '@/lib/products-server';
import { invalidateProductCaches } from '@/lib/product-cache';

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetchProductListEnvelope(request.nextUrl.search);
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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await proxyRequest(request, '/products', 'POST', body);
  if (response.ok) invalidateProductCaches();
  return response;
}
