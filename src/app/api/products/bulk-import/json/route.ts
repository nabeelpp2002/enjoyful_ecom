import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';
import { invalidateProductCaches } from '@/lib/product-cache';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await proxyRequest(request, '/products/bulk-import/json', 'POST', body);
  if (response.ok) invalidateProductCaches();
  return response;
}
