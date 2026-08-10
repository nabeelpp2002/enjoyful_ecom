import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';
import { fetchProductByIdEnvelope, storefrontCacheHeaders } from '@/lib/products-server';
import { invalidateProductCaches } from '@/lib/product-cache';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const upstream = await fetchProductByIdEnvelope(id);
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const response = await proxyRequest(request, `/products/${id}`, 'PATCH', body);
  if (response.ok) invalidateProductCaches();
  return response;
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await proxyRequest(request, `/products/${id}`, 'DELETE');
  if (response.ok) invalidateProductCaches();
  return response;
}
