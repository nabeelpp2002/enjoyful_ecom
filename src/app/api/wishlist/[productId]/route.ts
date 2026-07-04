import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyRequest(request, `/wishlist/${productId}`, 'POST');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyRequest(request, `/wishlist/${productId}`, 'DELETE');
}
