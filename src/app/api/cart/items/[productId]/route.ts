import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const body = await request.json();
  return proxyRequest(request, `/cart/items/${productId}`, 'PATCH', body);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyRequest(request, `/cart/items/${productId}`, 'DELETE');
}
